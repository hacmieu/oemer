# Kế hoạch (đề xuất): Thêm Frontend cho oemer

- **Ghi ngày**: 2026-07-25 23:19
- **Trạng thái**: ĐỀ XUẤT — chưa được duyệt, chưa thực hiện.
- **Lý do**: Hiện `oemer` chưa có FE (xem `reports/20260725_2319-phan-tich-frontend.md`).

## Mục tiêu
Cho phép người dùng upload ảnh bản nhạc qua giao diện và nhận về MusicXML (+ ảnh phân tích), thay vì chỉ dùng CLI.

## Các phương án

### Phương án A — Nhanh (khuyến nghị để thử nghiệm)
- Dùng **Gradio** hoặc **Streamlit** bọc trực tiếp `oemer.ete`.
- Ưu: rất ít code, chạy được ngay. Nhược: khó tùy biến UI, không tách BE/FE.

### Phương án B — Chuẩn production
1. **Backend API (FastAPI)**: endpoint `POST /transcribe` nhận ảnh → gọi pipeline trong `oemer/ete.py` → trả MusicXML + ảnh.
   - Cần xử lý tác vụ dài (3–5 phút/ảnh): dùng job async + polling hoặc hàng đợi (Celery/RQ).
2. **Frontend (React/Vue)**: trang upload ảnh, hiển thị tiến độ, xem/tải MusicXML, render nốt nhạc (vd. OpenSheetMusicDisplay).
3. **Đóng gói**: Docker cho BE (kèm checkpoints), CORS, giới hạn kích thước ảnh.

## Việc cần làm (nếu duyệt Phương án B)
- [ ] Tạo module API bọc `ete.main`/`ete` (tách phần chạy được không qua argparse).
- [ ] Xử lý tải checkpoint & thời gian inference dài (async job).
- [ ] Khởi tạo FE (upload → progress → kết quả), tích hợp OpenSheetMusicDisplay.
- [ ] Dockerfile + hướng dẫn chạy local.

## Rủi ro / lưu ý
- Inference nặng (GPU, 3–5 phút) ⇒ cần async, không block request.
- `origin` là repo upstream công khai ⇒ FE nên đặt ở fork/repo riêng, không push thẳng upstream.
