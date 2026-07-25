"""HTTP API for the oemer pipeline.

Transcription takes minutes, so requests never run it inline: uploading creates
a job and the client polls for the result.
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from server.jobs import DONE, FAILED, QUEUED, JobQueue
from server.transcribe import checkpoints_ready

MAX_UPLOAD_BYTES = int(os.environ.get("OEMER_MAX_UPLOAD_MB", "20")) * 1024 * 1024
ALLOWED_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff"}

queue: JobQueue


@asynccontextmanager
async def lifespan(app: FastAPI):
    global queue
    queue = JobQueue()
    yield
    queue.shutdown()


app = FastAPI(title="Oemer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("OEMER_CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "checkpoints": checkpoints_ready()}


@app.post("/api/jobs", status_code=202)
async def create_job(file: UploadFile = File(...)) -> dict:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(415, f"Unsupported image type '{suffix}'. "
                                 f"Allowed: {', '.join(sorted(ALLOWED_SUFFIXES))}")

    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"Image exceeds {MAX_UPLOAD_BYTES // 1024 // 1024} MB")

    job_id = queue.enqueue(file.filename or "upload.png", data)
    return {"job_id": job_id, "status": QUEUED}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str) -> dict:
    job = _require(job_id)
    body = {
        "job_id": job["id"],
        "status": job["status"],
        "filename": job["filename"],
        "created_at": job["created_at"],
        "finished_at": job["finished_at"],
    }
    if job["status"] == QUEUED:
        body["queue_position"] = queue.position(job_id)
    if job["status"] == FAILED:
        body["error"] = job["error"]
    if job["status"] == DONE:
        body["musicxml_url"] = f"/api/jobs/{job_id}/musicxml"
        if job["preview"]:
            body["preview_url"] = f"/api/jobs/{job_id}/preview"
    return body


@app.get("/api/jobs/{job_id}/musicxml")
def get_musicxml(job_id: str) -> FileResponse:
    job = _require(job_id)
    if job["status"] != DONE:
        raise HTTPException(409, f"Job is '{job['status']}', not ready")
    return FileResponse(job["musicxml"], media_type="application/vnd.recordare.musicxml+xml",
                        filename=f"{Path(job['filename']).stem}.musicxml")


@app.get("/api/jobs/{job_id}/preview")
def get_preview(job_id: str) -> FileResponse:
    job = _require(job_id)
    if not job["preview"]:
        raise HTTPException(404, "No preview for this job")
    return FileResponse(job["preview"], media_type="image/png")


def _require(job_id: str) -> dict:
    job = queue.get(job_id)
    if job is None:
        raise HTTPException(404, "Unknown job")
    return job
