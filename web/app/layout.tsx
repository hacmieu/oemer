import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oemer Studio",
  description:
    "Chuyển ảnh bản nhạc thành MusicXML nghe được ngay trên trình duyệt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col">
        <header className="sticky top-0 z-10 h-16 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <StaffMark />
              <span className="text-[15px] font-semibold tracking-tight">
                Oemer Studio
              </span>
            </Link>
            <a
              href="https://github.com/hacmieu/oemer"
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Mã nguồn
            </a>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-ink-muted">
            Nhận diện bản nhạc bằng{" "}
            <a
              href="https://github.com/BreezeWhite/oemer"
              className="text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink"
            >
              oemer
            </a>
            , hiển thị và phát nhạc bằng OpenSheetMusicDisplay.
          </div>
        </footer>
      </body>
    </html>
  );
}

/* A notehead on a staff. The notehead matters: five bare lines read as a
   hamburger menu. */
function StaffMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      {[3, 6.5, 10, 13.5, 17].map((y) => (
        <line
          key={y}
          x1="0.5"
          x2="19.5"
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.35"
        />
      ))}
      <ellipse
        cx="12"
        cy="13.5"
        rx="3.4"
        ry="2.6"
        transform="rotate(-20 12 13.5)"
        fill="currentColor"
      />
      <path d="M15.3 12.6V3.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
