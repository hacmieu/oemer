# Báo cáo: Hệ thống oemer đã có Frontend (FE) để dùng chưa?

- **Thời gian**: 2026-07-25 23:19
- **Phạm vi**: Toàn bộ repo `oemer` (`/Users/hacmieu/DevOps/HADE/oemer`)
- **Câu hỏi**: Hệ thống này đã có FE (giao diện người dùng) để dùng chưa?

## Kết luận ngắn gọn

**CHƯA.** `oemer` hiện tại **chỉ là công cụ dòng lệnh (CLI)** thuần Python, **không có frontend/giao diện web hay desktop** cho người dùng cuối.

## Bằng chứng

| Hạng mục | Kết quả |
|---|---|
| Web framework (Flask/FastAPI/Django) | Không có |
| App UI (Streamlit/Gradio) | Không có |
| `package.json` / React / Vue / Node FE | Không có |
| Máy chủ HTTP (`http.server`, `uvicorn`...) | Không có |
| Điểm vào (entry point) | Console script `oemer = oemer.ete:main` (CLI) |
| File HTML duy nhất | `docs/index.html` |

### `docs/index.html` là gì?
Đây **không phải** FE để dùng. Nó là **trang demo tĩnh (GitHub Pages)** chỉ để trình chiếu ảnh deskew/transcription kèm audio mẫu — không có upload, không gọi backend, không xử lý gì.

### Cách dùng hiện tại
- CLI: `oemer <path_to_image>` → xuất ra file MusicXML + ảnh phân tích.
- Notebook demo: `colab.ipynb` (chạy trên Google Colab).

## Kiến trúc thực tế (pipeline CLI)
`oemer/ete.py` (main) → segmentation (2 UNet) → staffline → notehead → note group → symbol → rhythm → build MusicXML (`build_system.py`).

## Khuyến nghị nếu muốn có FE
Xem kế hoạch đề xuất tại `plans/20260725_2319-ke-hoach-frontend.md`. Tóm tắt: bọc pipeline `ete.py` bằng một API (FastAPI) rồi thêm UI upload ảnh → hiển thị/tải MusicXML; hoặc dùng nhanh Gradio/Streamlit cho bản thử nghiệm.
