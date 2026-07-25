# Memory — Single Source of Truth

Thư mục lưu trữ "trí nhớ" bền vững của dự án: các sự thật, trạng thái, quyết định cần ghi nhớ giữa các phiên làm việc. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Chỉ mục trí nhớ

| Ngày giờ | Mục | Tóm tắt |
|---|---|---|
| 2026-07-26 01:54 | [**Dự án đã đóng**](20260726_0154-du-an-da-dong.md) | **MỚI NHẤT.** 🔴 ĐÓNG. Oemer kém Audiveris, tốn CPU, chưa có use case → dừng C2/C3. Code + log giữ trên fork. |
| 2026-07-26 01:31 | [Thử *Yêu Xa* từ Google Drive](20260726_0131-thu-yeuxa-google-drive.md) | PDF lead sheet → PNG → 4 phút 29 giây → nghe được. 3 ô đầu khớp cao độ; không có lời/hợp âm. API chưa nhận PDF. |
| 2026-07-26 00:59 | [Frontend MVP xong — Chu kỳ 1 hoàn tất](20260726_0059-frontend-mvp-xong.md) | Upload → chờ → xem → **nghe** → tải về, chạy thật end-to-end. Kèm 5 cạm bẫy OSMD đã trả giá. |
| 2026-07-26 00:24 | [Backend MVP xong + Giới hạn thông lượng](20260726_0024-backend-mvp-da-xong.md) | `server/` đã chạy, lỗi tranh chấp đã xử lý. ⚠️ Tăng worker không tăng thông lượng. |
| 2026-07-25 23:58 | [Kết quả SPIKE + Phiên bản đã kiểm chứng](20260725_2358-ket-qua-spike-va-phien-ban-da-kiem-chung.md) | SPIKE ĐẠT. Ghim OSMD 1.9.7 + audio player 1.0.0 + opencv&lt;5. |
| 2026-07-25 23:38 | [Đính chính race condition + Chốt hàng đợi](20260725_2338-dinh-chinh-race-condition-va-chot-hang-doi.md) | Thủ phạm `clear_data()`; ProcessPoolExecutor + SQLite. |
| 2026-07-25 23:27 | [Fork hacmieu + Ràng buộc kiến trúc](20260725_2327-fork-va-rang-buoc-kien-truc.md) | Fork `hacmieu/oemer`; stack OSMD + FastAPI + Next.js. |
| 2026-07-25 23:19 | [Trạng thái Frontend](20260725_2319-trang-thai-frontend.md) | Lịch sử: lúc đó chưa có FE. |

## Sự thật cốt lõi (tra nhanh)

**Trạng thái dự án**: 🔴 **ĐÃ ĐÓNG** (2026-07-26). Không tiếp tục phát triển. Lý do: chất lượng OMR kém Audiveris, tốn CPU, chưa có use case.

**Di sản kỹ thuật (Chu kỳ 1 đã xong rồi dừng)**
- `server/` FastAPI + ProcessPoolExecutor + SQLite
- `web/` Next.js: upload → tiến độ → OSMD + phát nhạc → tải MusicXML
- Fork: `origin` = `git@github.com:hacmieu/oemer.git`

**Ràng buộc kiến trúc vẫn đúng nếu mở lại**
1. `ete.clear_data()` + `_layers` global ⇒ **1 job / 1 tiến trình**, cấm thread.
2. ~4 phút/ảnh, ~331% CPU ⇒ tăng worker trên 1 máy không tăng thông lượng.
3. Ghim `opencv-python-headless<5`, OSMD `1.9.7`, `@isamu/osmd-audio-player` `1.0.0`.
