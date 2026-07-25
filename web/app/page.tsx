import Image from "next/image";

import { UploadDropzone } from "@/components/upload-dropzone";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div className="lg:pt-4">
          <h1 className="text-4xl font-semibold tracking-tighter text-ink md:text-5xl">
            Ảnh bản nhạc,
            <br />
            nghe được ngay.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-ink-muted">
            Tải lên ảnh chụp hoặc bản scan. Nhận về file MusicXML mở được bằng
            MuseScore, xem và nghe thử ngay tại đây.
          </p>

          <div className="mt-9">
            <UploadDropzone />
          </div>

          <p className="mt-4 text-sm text-ink-muted">
            Mỗi bản nhạc mất khoảng 4 phút để nhận diện. Bạn có thể để tab này
            chạy nền và quay lại sau.
          </p>
        </div>

        <figure className="lg:pt-2">
          <div className="paper overflow-hidden rounded-panel border border-line">
            <Image
              src="/example-score.png"
              alt="Bản nhạc piano Tabi sau khi nhận diện, hiển thị bằng OpenSheetMusicDisplay"
              width={900}
              height={550}
              priority
              className="w-full"
            />
          </div>
          <figcaption className="mt-3 text-sm text-ink-muted">
            Kết quả thật từ một ảnh chụp bản nhạc piano.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
