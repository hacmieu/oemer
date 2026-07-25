# Memory — Single Source of Truth

Thư mục lưu trữ "trí nhớ" bền vững của dự án: các sự thật, trạng thái, quyết định cần ghi nhớ giữa các phiên làm việc. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Chỉ mục trí nhớ

| Ngày giờ | Mục | Tóm tắt |
|---|---|---|
| 2026-07-26 00:24 | [**Backend MVP xong + Giới hạn thông lượng**](20260726_0024-backend-mvp-da-xong.md) | **MỚI NHẤT.** `server/` đã chạy, lỗi tranh chấp đã chứng minh xử lý xong (28 vs 14 ô nhịp). ⚠️ **Tăng worker không tăng thông lượng** — muốn nhiều người dùng phải thêm máy. |
| 2026-07-25 23:58 | [Kết quả SPIKE + Phiên bản đã kiểm chứng](20260725_2358-ket-qua-spike-va-phien-ban-da-kiem-chung.md) | SPIKE ĐẠT: render 183 ms + phát nhạc OK. Ghim `OSMD 1.9.7` + `@isamu/osmd-audio-player 1.0.0` + `opencv<5`. Bài học: phải test bằng bundler, không dùng CDN. |
| 2026-07-25 23:38 | [Đính chính race condition + Chốt hàng đợi](20260725_2338-dinh-chinh-race-condition-va-chot-hang-doi.md) | Đã chứng minh lỗi bằng thực nghiệm; thủ phạm là `clear_data()` chứ không phải "đè". Chốt bỏ Redis/Celery khỏi MVP, dùng `ProcessPoolExecutor` + SQLite. Downloader checkpoint chậm do `chunk_size=512B`. |
| 2026-07-25 23:27 | [Fork hacmieu + Ràng buộc kiến trúc](20260725_2327-fork-va-rang-buoc-kien-truc.md) | Đã fork sang `hacmieu/oemer`; `origin`=fork, `upstream`=repo gốc. Chốt stack OSMD + FastAPI + Next.js. ⚠️ Phần mô tả "ghi đè dữ liệu" đã được **đính chính** ở mục 23:38. |
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
1. `oemer/layers.py` có `_layers = {}` **global cấp module**, và `ete.clear_data()` xoá sạch nó mỗi lần chạy ⇒ 2 job cùng tiến trình sẽ **trả kết quả của nhau, im lặng không báo lỗi** (đã chứng minh thực nghiệm). **1 job / 1 tiến trình**; cấm thread.
2. Xử lý mất **3–5 phút/ảnh** ⇒ bắt buộc hàng đợi bất đồng bộ.
3. `ete.extract()` gắn với `argparse.Namespace` ⇒ cần wrapper.
4. Checkpoint tải runtime **rất chậm** (`chunk_size=512B`) ⇒ bake vào Docker image; chỉ cần 2 file `.onnx`.

**Quyết định hàng đợi**: Chu kỳ 1 dùng `ProcessPoolExecutor` + SQLite (không Redis/Celery). Nâng cấp sau theo tiêu chí đo được.

**Phiên bản đã kiểm chứng — PHẢI GHIM** 📌
```
opensheetmusicdisplay      1.9.7            (chưa nâng 2.1.0)
@isamu/osmd-audio-player   1.0.0
opencv-python-headless     >=4.5.3.56,<5    (OpenCV 5 làm SẬP pipeline)
```

**Số đo thực tế**: transcribe 1 ảnh = **4 phút 07 giây** (CPU Apple Silicon); OSMD render = 183 ms.

**⚠️ Giới hạn thông lượng**: 2 job song song mất **8 phút 41 giây** — gần bằng chạy tuần tự. Pipeline vốn đã dùng ~331% CPU nên **tăng worker không tăng thông lượng**. Muốn phục vụ nhiều người **phải thêm máy**.

**Trạng thái code**: `server/` (backend FastAPI) đã chạy và có test bảo vệ. `web/` mới chỉ có SPIKE, **chưa có frontend thật**.

**Cạm bẫy thư viện**
- OSMD là **renderer, không phải editor**.
- OSMD audio player chính thức = **sponsor trả phí**; bản cộng đồng `jimutt/*` đã **ngừng phát triển**.
- RiffScore **chưa import được MusicXML** ⇒ chưa dùng cho việc sửa nhạc.
- **Đừng test thư viện bằng CDN `esm.sh`** — interop CJS sai làm ra kết luận sai. Luôn test bằng bundler thật.
- `--save-cache` tạo `.pkl` nặng **147 MB/ảnh** → không dùng trên production.
