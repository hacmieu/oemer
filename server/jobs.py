"""Job queue backed by a process pool and a SQLite table.

A process pool rather than threads because the oemer pipeline stores state in
module-level globals; see server/transcribe.py. Workers are OS processes, so
each job gets its own copy of that state.

Deliberately not Redis/Celery: the only hard requirement is process isolation,
which the standard library already provides. See
plans/20260725_2338-act-don-gian-hoa-hang-doi.md for the upgrade triggers.
"""
import os
import sqlite3
import uuid
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(os.environ.get("OEMER_DATA_DIR", Path(__file__).parent / "data"))
UPLOAD_DIR = DATA_DIR / "uploads"
RESULT_DIR = DATA_DIR / "results"
DB_PATH = DATA_DIR / "jobs.db"

# One job saturates several cores, so a high worker count only adds contention.
MAX_WORKERS = int(os.environ.get("OEMER_MAX_WORKERS", "2"))

QUEUED, RUNNING, DONE, FAILED = "queued", "running", "done", "failed"


def _connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, timeout=30)
    conn.row_factory = sqlite3.Row
    # Workers write concurrently from separate processes.
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    for d in (UPLOAD_DIR, RESULT_DIR):
        d.mkdir(parents=True, exist_ok=True)
    with _connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id           TEXT PRIMARY KEY,
                status       TEXT NOT NULL,
                filename     TEXT NOT NULL,
                musicxml     TEXT,
                preview      TEXT,
                error        TEXT,
                created_at   TEXT NOT NULL,
                finished_at  TEXT
            )
        """)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _set_status(db_path: Path, job_id: str, **fields) -> None:
    cols = ", ".join(f"{k} = ?" for k in fields)
    with _connect(db_path) as conn:
        conn.execute(f"UPDATE jobs SET {cols} WHERE id = ?", (*fields.values(), job_id))


def _run(job_id: str, img_path: str, out_dir: str, db_path: str) -> None:
    """Entry point executed inside a worker process."""
    from server.transcribe import transcribe

    db = Path(db_path)
    _set_status(db, job_id, status=RUNNING)
    try:
        result = transcribe(Path(img_path), Path(out_dir))
        _set_status(
            db, job_id,
            status=DONE,
            musicxml=str(result.musicxml),
            preview=str(result.preview) if result.preview else None,
            finished_at=_now(),
        )
    except Exception as exc:
        _set_status(db, job_id, status=FAILED, error=f"{type(exc).__name__}: {exc}",
                    finished_at=_now())
        raise


class JobQueue:
    """Kept behind a narrow interface so the backend can be swapped for Redis/RQ."""

    def __init__(self, max_workers: int = MAX_WORKERS):
        init_db()
        self._pool = ProcessPoolExecutor(max_workers=max_workers)

    def enqueue(self, filename: str, image_bytes: bytes) -> str:
        job_id = uuid.uuid4().hex
        img_path = UPLOAD_DIR / f"{job_id}{Path(filename).suffix or '.png'}"
        img_path.write_bytes(image_bytes)

        with _connect(DB_PATH) as conn:
            conn.execute(
                "INSERT INTO jobs (id, status, filename, created_at) VALUES (?, ?, ?, ?)",
                (job_id, QUEUED, filename, _now()),
            )

        self._pool.submit(_run, job_id, str(img_path), str(RESULT_DIR / job_id), str(DB_PATH))
        return job_id

    def get(self, job_id: str) -> dict | None:
        with _connect(DB_PATH) as conn:
            row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        return dict(row) if row else None

    def position(self, job_id: str) -> int:
        """How many jobs are still ahead of this one."""
        with _connect(DB_PATH) as conn:
            row = conn.execute(
                "SELECT COUNT(*) AS n FROM jobs WHERE status = ? AND created_at < "
                "(SELECT created_at FROM jobs WHERE id = ?)",
                (QUEUED, job_id),
            ).fetchone()
        return row["n"]

    def shutdown(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=True)
