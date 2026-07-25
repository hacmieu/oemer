# Plans — Single Source of Truth

Thư mục chứa các kế hoạch công việc (đề xuất / đang làm / đã xong). Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Kế hoạch đang hoạt động

| Ngày giờ | Kế hoạch | Trạng thái | Tóm tắt |
|---|---|---|---|
| 2026-07-25 23:27 | [**PDCA — Frontend "Oemer Web"**](20260725_2327-pdca-frontend-oemer-web.md) | 🟢 ĐANG CHẠY | Kế hoạch chính thức. 3 chu kỳ PDCA: (1) MVP upload→xem→nghe, (2) chịu tải nhiều người dùng + UI chuyên nghiệp, (3) sửa nhạc online. |
| 2026-07-25 23:38 | [ACT — Đơn giản hoá hàng đợi](20260725_2338-act-don-gian-hoa-hang-doi.md) | ✅ ĐÃ ÁP DỤNG | **Sửa đổi kế hoạch trên.** Bỏ Redis/Celery khỏi MVP → dùng `ProcessPoolExecutor` + SQLite. Kèm tiêu chí đo được để biết khi nào mới cần nâng cấp. |

## Kế hoạch đã thay thế

| Ngày giờ | Kế hoạch | Trạng thái | Ghi chú |
|---|---|---|---|
| 2026-07-25 23:19 | [Thêm Frontend cho oemer](20260725_2319-ke-hoach-frontend.md) | ⚪ ĐÃ THAY THẾ | Bản nháp sơ bộ, đã được bản PDCA 23:27 thay thế. |

## Tiến độ Chu kỳ 1

| Hạng mục | Trạng thái |
|---|---|
| SPIKE — kiểm chứng render + phát nhạc | ✅ **ĐẠT** ([báo cáo](../reports/20260725_2358-ket-qua-spike-osmd-playback.md)) |
| Dựng môi trường dev + chạy pipeline thật | ✅ Xong (gỡ được lỗi chặn OpenCV 5) |
| Wrapper `transcribe()` không qua argparse | ⬜ Chưa làm |
| FastAPI + ProcessPoolExecutor + SQLite | ⬜ Chưa làm |
| Frontend Next.js (upload → tiến độ → kết quả) | ⬜ Chưa làm |
| Test hồi quy đồng thời (2 ảnh cùng lúc) | ⬜ Chưa làm |
| Dockerfile bake sẵn checkpoint | ⬜ Chưa làm |

**Phiên bản đã kiểm chứng, phải ghim**: `opensheetmusicdisplay@1.9.7` + `@isamu/osmd-audio-player@1.0.0` + `opencv-python-headless<5`.

## Tóm tắt kế hoạch PDCA hiện hành

**Mục tiêu**: App web giao diện chuyên nghiệp, nhiều người dùng, **nghe được** bản nhạc vừa transcribe, **tương lai sửa được**.

| Chu kỳ | Nội dung | Tiêu chí thành công chính |
|---|---|---|
| **1 — MVP** | Upload → hàng đợi → OSMD render → phát nhạc → tải MusicXML | 2 người upload đồng thời không lẫn dữ liệu; bấm Play ra tiếng |
| **2 — Quy mô** | Auth, Postgres, S3/R2, rate limit, auto-scale worker, design system, responsive | 20 người đồng thời không sập; Lighthouse a11y ≥ 90 |
| **3 — Sửa nhạc** | Đánh giá lại RiffScore / tự xây lớp sửa trên OSMD / Flat.io Embed | Sửa lỗi OMR của 1 bản nhạc trong < 5 phút |

**Stack**: Next.js + TypeScript + Tailwind + shadcn/ui · FastAPI · Redis/RQ · Postgres · Docker Compose · OSMD + `@isamu/osmd-audio-player`.

**Bước tiếp theo**: SPIKE đã ĐẠT ✅. Tiếp tục Chu kỳ 1 với backend (wrapper `transcribe()` → FastAPI + `ProcessPoolExecutor` + SQLite) rồi tới frontend Next.js.
