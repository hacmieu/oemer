# Memory — Single Source of Truth

Thư mục lưu trữ "trí nhớ" bền vững của dự án: các sự thật, trạng thái, quyết định cần ghi nhớ giữa các phiên làm việc. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Chỉ mục trí nhớ

| Ngày giờ | Mục | Tóm tắt |
|---|---|---|
| 2026-07-25 23:27 | [Fork hacmieu + Ràng buộc kiến trúc](20260725_2327-fork-va-rang-buoc-kien-truc.md) | **MỚI NHẤT.** Đã fork sang `hacmieu/oemer`; `origin`=fork, `upstream`=repo gốc. Ràng buộc: `layers.py` dùng global state ⇒ không chạy song song trong 1 tiến trình. Chốt stack OSMD + FastAPI + Next.js. |
| 2026-07-25 23:19 | [Trạng thái Frontend](20260725_2319-trang-thai-frontend.md) | `oemer` là CLI thuần Python, **chưa có FE**. ⚠️ Phần "không được push" đã **lỗi thời** (xem mục 23:27). |

## Sự thật cốt lõi (tra nhanh)

**Dự án**
- **Loại**: OMR (Optical Music Recognition) — ảnh bản nhạc → MusicXML.
- **Giao diện hiện tại**: CLI (`oemer <img>`) + `colab.ipynb`. **Chưa có FE web.**
- **Entry point**: `oemer = oemer.ete:main`; pipeline chính ở `oemer/ete.py`.

**Git**
- `origin` = `git@github.com:hacmieu/oemer.git` ← push vào đây.
- `upstream` = `https://github.com/BreezeWhite/oemer.git` ← chỉ fetch.

**Ràng buộc kiến trúc (quan trọng nhất)** ⚠️
1. `oemer/layers.py` có `_layers = {}` **global cấp module** ⇒ **1 job / 1 tiến trình**, scale bằng process chứ không phải thread.
2. Xử lý mất **3–5 phút/ảnh** ⇒ bắt buộc hàng đợi bất đồng bộ.
3. `ete.extract()` gắn với `argparse.Namespace` ⇒ cần wrapper.
4. Checkpoint tải runtime ⇒ bake vào Docker image.

**Cạm bẫy thư viện**
- OSMD là **renderer, không phải editor**.
- OSMD audio player chính thức = **sponsor trả phí**; bản cộng đồng `jimutt/*` đã **ngừng phát triển**.
- RiffScore **chưa import được MusicXML** ⇒ chưa dùng cho việc sửa nhạc.
