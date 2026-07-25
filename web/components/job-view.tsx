"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Warning } from "@phosphor-icons/react";

import { ButtonLink } from "@/components/button";
import { ScoreResult } from "@/components/score-result";
import { type Job, TYPICAL_DURATION_SECONDS, getJob } from "@/lib/api";

const POLL_MS = 2000;

export function JobView({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const next = await getJob(jobId);
        if (!live) return;
        setJob(next);
        setLoadError(null);
        if (next.status === "queued" || next.status === "running") {
          timer = setTimeout(poll, POLL_MS);
        }
      } catch (e) {
        if (!live) return;
        setLoadError(e instanceof Error ? e.message : "Mất kết nối tới máy chủ.");
        timer = setTimeout(poll, POLL_MS * 2);
      }
    }

    poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [jobId]);

  if (loadError && !job) {
    return (
      <Panel>
        <Failure
          title="Không kết nối được máy chủ"
          message={loadError}
          hint="Bản nhạc của bạn vẫn đang được xử lý. Đang tự thử lại, bạn không cần tải lại trang."
        />
      </Panel>
    );
  }
  if (!job) return <Panel><Skeleton /></Panel>;

  if (job.status === "failed") {
    return (
      <Panel>
        <Failure
          title="Không nhận diện được bản nhạc"
          message={job.error ?? "Nhận diện thất bại."}
          hint="Ảnh chụp nghiêng, mờ hoặc thiếu sáng thường là nguyên nhân. Thử chụp lại thẳng góc và đủ sáng."
        />
      </Panel>
    );
  }

  if (job.status === "done") return <ScoreResult job={job} />;

  return (
    <Panel>
      <Waiting job={job} stale={loadError} />
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <BackLink />
      <div className="mt-8 rounded-panel border border-line bg-surface p-8">
        {children}
      </div>
    </div>
  );
}

export function BackLink() {
  return (
    <ButtonLink href="/" variant="secondary" className="h-9 px-3">
      <ArrowLeft size={16} aria-hidden />
      Bản nhạc khác
    </ButtonLink>
  );
}

function Waiting({ job, stale }: { job: Job; stale: string | null }) {
  const elapsed = useElapsed(job.created_at);
  const queued = job.status === "queued";

  return (
    <div role="status" aria-live="polite">
      <p className="text-lg font-medium tracking-tight text-ink">
        {queued ? "Đang chờ tới lượt" : "Đang nhận diện bản nhạc"}
      </p>
      <p className="mt-1.5 text-sm text-ink-muted">
        {queued
          ? job.queue_position
            ? `Còn ${job.queue_position} bản nhạc phía trước.`
            : "Sắp bắt đầu."
          : "Thường mất khoảng 4 phút. Bạn có thể để tab này chạy nền."}
      </p>

      {/* Indeterminate on purpose. The pipeline reports no intermediate steps,
          so any percentage here would be invented. */}
      <div className="mt-6 h-1 overflow-hidden rounded-full bg-sunken">
        <div className="h-full w-1/3 animate-[slide_1.8s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-ink-muted">Đã chạy</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-ink">{format(elapsed)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Thường mất</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-ink-muted">
            {format(TYPICAL_DURATION_SECONDS)}
          </dd>
        </div>
      </dl>

      <p className="mt-6 truncate border-t border-line pt-4 text-sm text-ink-faint">
        {job.filename}
      </p>

      {stale && (
        <p className="mt-3 text-sm text-ink-muted">
          Chưa hỏi được máy chủ, đang thử lại.
        </p>
      )}

      <style>{`@keyframes slide {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(300%); }
      }`}</style>
    </div>
  );
}

function Failure({
  title,
  message,
  hint,
}: {
  title: string;
  message: string;
  hint?: string;
}) {
  return (
    <div role="alert">
      <Warning size={24} weight="light" aria-hidden className="text-danger" />
      <p className="mt-3 text-lg font-medium tracking-tight text-ink">{title}</p>
      <p className="mt-1.5 text-sm text-ink-muted">{message}</p>
      {hint && <p className="mt-3 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-52 rounded bg-sunken" />
      <div className="mt-3 h-4 w-72 rounded bg-sunken" />
      <div className="mt-6 h-1 rounded-full bg-sunken" />
      <div className="mt-6 h-10 w-40 rounded bg-sunken" />
    </div>
  );
}

function useElapsed(since: string) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => setSeconds(Math.max(0, Math.round((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);
  return seconds;
}

function format(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
