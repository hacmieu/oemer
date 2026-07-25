# Memory: Trạng thái Frontend của oemer

- **Ghi ngày**: 2026-07-25 23:19

## Sự thật cần nhớ
- `oemer` là **CLI thuần Python** (OMR: ảnh nhạc → MusicXML). **Không có FE.**
- Entry point: `oemer = oemer.ete:main` (định nghĩa trong `setup.py`); pipeline chính ở `oemer/ete.py`.
- **Không** có Flask/FastAPI/Django/Streamlit/Gradio/`package.json`/React/Vue.
- `docs/index.html` = trang demo **tĩnh** cho GitHub Pages, KHÔNG phải giao diện dùng được.
- Cách dùng: `oemer <path_to_image>` hoặc `colab.ipynb`.

## Bối cảnh Git (quan trọng)
- `origin` = `https://github.com/BreezeWhite/oemer.git` → **repo upstream công khai**, không phải fork của người dùng.
- Vì vậy **không tự động `git push`** các file log (memory/plans/reports) lên upstream. Cần người dùng xác nhận / trỏ về fork riêng trước khi push.

## Chi tiết đầy đủ
Xem báo cáo: `reports/20260725_2319-phan-tich-frontend.md`.
