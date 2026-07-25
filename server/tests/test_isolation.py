"""Guards the constraint that makes the whole queue design necessary.

The oemer pipeline keeps its layer registry in a module-level global and wipes
it with ete.clear_data() on every run, so two transcriptions sharing a process
return each other's data with no error raised. These tests exercise the real
oemer.layers module rather than a stand-in, so they keep working if that
module changes.
"""
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

import numpy as np


def _transcribe_like(tag: str, value: int, start_delay: float, work_time: float):
    """Mimics the register -> long work -> read sequence that ete.extract performs."""
    from oemer import ete, layers

    time.sleep(start_delay)
    ete.clear_data()
    layers.register_layer("staff_pred", np.full((2, 2), value, dtype=np.int64))
    time.sleep(work_time)
    return tag, int(layers.get_layer("staff_pred")[0][0])


# Job B starts mid-way through job A and finishes first, which is exactly the
# interleaving a queue produces when two users upload at the same time.
JOB_A = ("A", 111, 0.0, 1.0)
JOB_B = ("B", 222, 0.2, 0.2)
EXPECTED = {"A": 111, "B": 222}


def test_process_pool_keeps_jobs_isolated():
    with ProcessPoolExecutor(max_workers=2) as pool:
        results = dict(pool.map(_transcribe_like, *zip(JOB_A, JOB_B)))

    assert results == EXPECTED, (
        f"A job read back another job's data: {results} != {EXPECTED}. "
        "Every job must run in its own process."
    )


def test_threads_do_corrupt_jobs():
    """Proves the test above is not vacuous, and documents why threads are banned.

    If this ever passes, oemer's global layer registry is gone and the process
    pool in server/jobs.py can be reconsidered.
    """
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = dict(pool.map(_transcribe_like, *zip(JOB_A, JOB_B)))

    assert results != EXPECTED, (
        "Threads unexpectedly kept jobs isolated. Re-check oemer/layers.py: if the "
        "module-level registry is gone, update server/jobs.py and this test."
    )
    assert results["A"] == 222, f"Expected job A to read job B's data, got {results}"
