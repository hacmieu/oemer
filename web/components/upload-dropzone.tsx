"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageSquare, Spinner, UploadSimple, Warning } from "@phosphor-icons/react";

import { Button } from "@/components/button";
import { ACCEPTED_TYPES, MAX_UPLOAD_MB, createJob } from "@/lib/api";

const ACCEPTED = new Set(ACCEPTED_TYPES.split(","));

export function UploadDropzone() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function choose(next: File | undefined) {
    if (!next) return;
    const suffix = next.name.slice(next.name.lastIndexOf(".")).toLowerCase();

    if (!ACCEPTED.has(suffix)) {
      setError(`Chưa hỗ trợ định dạng ${suffix || "này"}. Hãy dùng PNG, JPG, GIF, BMP hoặc TIFF.`);
      return;
    }
    if (next.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(
        `Ảnh nặng ${(next.size / 1024 / 1024).toFixed(1)} MB, vượt giới hạn ${MAX_UPLOAD_MB} MB.`,
      );
      return;
    }

    setError(null);
    setFile(next);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(next);
    });
  }

  async function submit() {
    if (!file) return;
    setSending(true);
    setError(null);
    try {
      const { job_id } = await createJob(file);
      router.push(`/jobs/${job_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được ảnh lên máy chủ.");
      setSending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0]);
        }}
        className={`rounded-panel border border-dashed p-8 text-center transition-colors ${
          dragging ? "border-accent bg-accent-soft" : "border-line-strong bg-surface"
        }`}
      >
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt={`Xem trước ${file?.name}`}
            className="mx-auto max-h-64 rounded-control border border-line object-contain"
          />
        ) : (
          <ImageSquare
            size={32}
            weight="light"
            aria-hidden
            className="mx-auto text-ink-faint"
          />
        )}

        <p className="mt-4 text-sm text-ink">
          {file ? file.name : "Kéo ảnh bản nhạc vào đây"}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {file
            ? `${(file.size / 1024).toFixed(0)} KB`
            : `PNG, JPG, GIF, BMP hoặc TIFF, tối đa ${MAX_UPLOAD_MB} MB`}
        </p>

        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => input.current?.click()}
          disabled={sending}
        >
          {file ? "Chọn ảnh khác" : "Chọn ảnh từ máy"}
        </Button>

        <input
          ref={input}
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <Warning size={18} weight="fill" aria-hidden className="mt-px shrink-0" />
          {error}
        </p>
      )}

      {/* Only appears once there is something to submit. A permanently disabled
          primary button would sit there as dead weight on first load. */}
      {file && (
        <Button onClick={submit} disabled={sending} className="h-11">
          {sending ? (
            <>
              <Spinner size={16} aria-hidden className="animate-spin" />
              Đang gửi
            </>
          ) : (
            <>
              <UploadSimple size={16} aria-hidden />
              Bắt đầu nhận diện
            </>
          )}
        </Button>
      )}
    </div>
  );
}
