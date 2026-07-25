"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DownloadSimple, Image as ImageIcon } from "@phosphor-icons/react";

import { AnchorButton } from "@/components/button";
import { BackLink } from "@/components/job-view";
import { type Job, absolute, fetchMusicXml } from "@/lib/api";

/* OSMD measures the DOM while rendering, so it cannot run on the server. */
const ScoreViewer = dynamic(() => import("@/components/score-viewer"), {
  ssr: false,
});

export function ScoreResult({ job }: { job: Job }) {
  const [xml, setXml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchMusicXml(job)
      .then((text) => live && setXml(text))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [job]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <BackLink />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
            {job.filename}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Nhận diện xong. Nghe thử bên dưới hoặc tải file về để chỉnh sửa
            trong MuseScore.
          </p>
        </div>

        <div className="flex gap-2">
          {job.preview_url && (
            <AnchorButton
              variant="secondary"
              href={absolute(job.preview_url)}
              target="_blank"
              rel="noreferrer"
            >
              <ImageIcon size={16} aria-hidden />
              Ảnh phân tích
            </AnchorButton>
          )}
          <AnchorButton href={absolute(job.musicxml_url!)} download>
            <DownloadSimple size={16} aria-hidden />
            Tải MusicXML
          </AnchorButton>
        </div>
      </div>

      {/* No overflow-hidden here: it would stop the transport bar from sticking. */}
      <div className="mt-6 rounded-panel border border-line bg-surface">
        {error ? (
          <p role="alert" className="px-5 py-6 text-sm text-danger">
            {error}
          </p>
        ) : xml ? (
          <ScoreViewer xml={xml} />
        ) : (
          <p className="px-5 py-6 text-sm text-ink-muted">Đang tải bản nhạc</p>
        )}
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        Nhận diện tự động luôn có sai sót. Hãy đối chiếu với bản gốc trước khi
        dùng, và sửa lại trong MuseScore nếu cần.
      </p>
    </div>
  );
}
