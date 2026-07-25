# Memory: Đính chính cơ chế race condition + Chốt phương án hàng đợi

- **Ghi ngày**: 2026-07-25 23:38
- **Thay thế**: phần mô tả race condition trong `memory/20260725_2327-fork-va-rang-buoc-kien-truc.md`

## 1. ĐÍNH CHÍNH: cơ chế lỗi không phải "đè dữ liệu"

Đã **chứng minh bằng thực nghiệm** (`reports/20260725_2338-check-thuc-nghiem-race-condition.md`). Lỗi có thật, nhưng cơ chế khác với mô tả cũ:

- ❌ Mô tả cũ (SAI): *"register_layer ghi đè dữ liệu của nhau"*.
- ✅ Thực tế: `register_layer()` khi trùng tên chỉ `print` rồi `return` — **không ghi gì cả**.
- ✅ Thủ phạm thật là **`ete.clear_data()`**: mỗi lần chạy nó xoá **toàn bộ** `_layers` của tiến trình, **kể cả layer của job đang chạy dở**.

**Diễn biến**: Job A đăng ký layer → Job B chen vào gọi `clear_data()` xoá sạch → Job B đăng ký layer của mình → Job A đọc `get_layer()` và **nhận dữ liệu của job B**.

**Kết quả thực nghiệm**: `job A ghi 111, đọc lại 222` → nhận nhầm dữ liệu job khác, **im lặng, không exception**.

**Hai kiểu hỏng**:
1. **Trả kết quả sai** (nguy hiểm nhất — không báo lỗi, người dùng nhận nhầm bản nhạc của người khác).
2. **`KeyError`** nếu đọc đúng lúc vừa bị xoá mà chưa đăng ký lại.

**Quy tắc bất di bất dịch**: mỗi job = **1 tiến trình riêng**. Cấm dùng thread, cấm gọi pipeline trực tiếp trong endpoint FastAPI.

## 2. CHỐT: bỏ Redis/Celery khỏi MVP

Xem `plans/20260725_2338-act-don-gian-hoa-hang-doi.md`.

- **Chu kỳ 1**: `ProcessPoolExecutor` (thư viện chuẩn) + **SQLite**. Đủ để cô lập tiến trình, **0 service phụ**.
- **Chu kỳ 2**: chỉ nâng lên Redis + RQ khi chạm tiêu chí đo được (worker khác máy / mất job khi restart / cần retry / hàng đợi > 20 job).
- Bọc sau interface `JobQueue` (`enqueue()`, `get_status()`) để đổi backend không phải sửa API và frontend.

*Redis thực chất là hộp thư chung giữa tiến trình API và worker + bảng trạng thái job. Celery/RQ là thư viện quản lý hộp thư đó. Cả hai chỉ cần khi vượt phạm vi 1 máy.*

## 3. Phát hiện thêm: downloader checkpoint cực chậm 🐌
`ete.download_file()` dùng `chunk_size = 2**9` (**512 byte**) kèm `print` mỗi vòng lặp.

- Thực đo: downloader của oemer tải được **19% của file 70MB sau ~5 phút**.
- `curl` tải **cả 2 file onnx (109MB) trong ~20 giây**.
- `main()` còn tải cả 2 file `.h5` (TensorFlow, ~110MB) dù mặc định chạy onnxruntime → **lãng phí**.
- ⇒ Docker image **phải bake sẵn checkpoint**, tuyệt đối không để tải lúc runtime.
- ⇒ Chỉ cần 2 file `.onnx`; `main()` chỉ kiểm tra `unet_big/model.onnx` tồn tại là bỏ qua toàn bộ bước tải.

## 4. Môi trường dev cục bộ đã dựng
- `.venv/` (Python 3.13.5) đã cài `pip install -e .` — đã gitignore.
- Checkpoint đã tải về `oemer/checkpoints/{unet_big,seg_net}/model.onnx` — đã gitignore (`checkpoints/`).
- Chạy thử: `.venv/bin/oemer figures/tabi.jpg -o /tmp/oemer_out`
