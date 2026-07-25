export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8500";

export type JobStatus = "queued" | "running" | "done" | "failed";

export type Job = {
  job_id: string;
  status: JobStatus;
  filename: string;
  created_at: string;
  finished_at: string | null;
  queue_position?: number;
  error?: string;
  musicxml_url?: string;
  preview_url?: string;
};

export const ACCEPTED_TYPES = ".png,.jpg,.jpeg,.gif,.bmp,.tif,.tiff";
export const MAX_UPLOAD_MB = 20;

/** Roughly how long one transcription takes, measured on a CPU-only machine.
 *  Shown to the user so a four minute wait reads as expected, not as a hang. */
export const TYPICAL_DURATION_SECONDS = 250;

class ApiError extends Error {}

/** A dropped connection surfaces as TypeError("Failed to fetch"), which is not
 *  something to show a user. Everything leaves this module already worded. */
async function request(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError("Không kết nối được tới máy chủ.");
  }
  if (!res.ok) {
    const detail = await res
      .json()
      .then((b) => b.detail)
      .catch(() => null);
    throw new ApiError(detail ?? `Máy chủ trả về lỗi ${res.status}.`);
  }
  return res;
}

export async function createJob(file: File): Promise<{ job_id: string }> {
  const body = new FormData();
  body.append("file", file);
  return (await request("/api/jobs", { method: "POST", body })).json();
}

export async function getJob(id: string): Promise<Job> {
  return (await request(`/api/jobs/${id}`, { cache: "no-store" })).json();
}

export async function fetchMusicXml(job: Job): Promise<string> {
  return (await request(job.musicxml_url!)).text();
}

export const absolute = (path: string) => `${API_BASE}${path}`;
