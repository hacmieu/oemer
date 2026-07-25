# Plans — Single Source of Truth

Thư mục chứa các kế hoạch công việc (đề xuất / đang làm / đã xong). Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Kế hoạch đang hoạt động

| Ngày giờ | Kế hoạch | Trạng thái | Tóm tắt |
|---|---|---|---|
| 2026-07-25 23:27 | [**PDCA — Frontend "Oemer Web"**](20260725_2327-pdca-frontend-oemer-web.md) | 🟡 PLAN — chờ duyệt | Kế hoạch chính thức. 3 chu kỳ PDCA: (1) MVP upload→xem→nghe, (2) chịu tải nhiều người dùng + UI chuyên nghiệp, (3) sửa nhạc online. |

## Kế hoạch đã thay thế

| Ngày giờ | Kế hoạch | Trạng thái | Ghi chú |
|---|---|---|---|
| 2026-07-25 23:19 | [Thêm Frontend cho oemer](20260725_2319-ke-hoach-frontend.md) | ⚪ ĐÃ THAY THẾ | Bản nháp sơ bộ, đã được bản PDCA 23:27 thay thế. |

## Tóm tắt kế hoạch PDCA hiện hành

**Mục tiêu**: App web giao diện chuyên nghiệp, nhiều người dùng, **nghe được** bản nhạc vừa transcribe, **tương lai sửa được**.

| Chu kỳ | Nội dung | Tiêu chí thành công chính |
|---|---|---|
| **1 — MVP** | Upload → hàng đợi → OSMD render → phát nhạc → tải MusicXML | 2 người upload đồng thời không lẫn dữ liệu; bấm Play ra tiếng |
| **2 — Quy mô** | Auth, Postgres, S3/R2, rate limit, auto-scale worker, design system, responsive | 20 người đồng thời không sập; Lighthouse a11y ≥ 90 |
| **3 — Sửa nhạc** | Đánh giá lại RiffScore / tự xây lớp sửa trên OSMD / Flat.io Embed | Sửa lỗi OMR của 1 bản nhạc trong < 5 phút |

**Stack**: Next.js + TypeScript + Tailwind + shadcn/ui · FastAPI · Redis/RQ · Postgres · Docker Compose · OSMD + `@isamu/osmd-audio-player`.

**Bước tiếp theo (chờ duyệt)**: SPIKE nửa ngày — kiểm chứng OSMD + audio player đọc được file `.musicxml` do chính `oemer` sinh ra. Đây là rủi ro cao nhất, cần loại bỏ trước khi xây hệ thống.
