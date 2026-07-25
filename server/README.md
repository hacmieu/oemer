# server/ — HTTP API cho oemer

Backend của Chu kỳ 1 (MVP). Nhận ảnh bản nhạc, chạy pipeline oemer ở nền, trả về MusicXML.

Kế hoạch: `../plans/20260725_2327-pdca-frontend-oemer-web.md`

## Chạy thử

```bash
# Từ thư mục gốc repo
pip install -e .                        # pipeline oemer
pip install -r server/requirements.txt  # API

# Cần sẵn checkpoint (KHÔNG để oemer tự tải, xem mục Lưu ý)
curl -L -o oemer/checkpoints/unet_big/model.onnx \
  https://github.com/BreezeWhite/oemer/releases/download/checkpoints/1st_model.onnx
curl -L -o oemer/checkpoints/seg_net/model.onnx \
  https://github.com/BreezeWhite/oemer/releases/download/checkpoints/2nd_model.onnx

uvicorn server.app:app --port 8500
```

## API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra server và checkpoint |
| `POST` | `/api/jobs` | Upload ảnh (multipart `file`) → `202 {job_id, status}` |
| `GET` | `/api/jobs/{id}` | Trạng thái: `queued` (kèm `queue_position`) / `running` / `done` / `failed` |
| `GET` | `/api/jobs/{id}/musicxml` | Tải MusicXML (chỉ khi `done`) |
| `GET` | `/api/jobs/{id}/preview` | Ảnh đánh dấu các ký hiệu nhận diện được |

```bash
JOB=$(curl -s -X POST -F "file=@figures/tabi.jpg" localhost:8500/api/jobs | jq -r .job_id)
curl -s localhost:8500/api/jobs/$JOB          # chờ tới khi status = done
curl -s localhost:8500/api/jobs/$JOB/musicxml -o ket-qua.musicxml
```

## Cấu hình

| Biến môi trường | Mặc định | Ý nghĩa |
|---|---|---|
| `OEMER_DATA_DIR` | `server/data` | Nơi lưu ảnh upload, kết quả, `jobs.db` |
| `OEMER_MAX_WORKERS` | `2` | Số job chạy song song (xem Lưu ý) |
| `OEMER_MAX_UPLOAD_MB` | `20` | Giới hạn dung lượng ảnh |
| `OEMER_CORS_ORIGINS` | `http://localhost:3000` | Danh sách origin, phân tách bằng dấu phẩy |

## ⚠️ Lưu ý bắt buộc

**1. Mỗi job phải chạy trong một tiến trình riêng.**
`oemer/layers.py` giữ dữ liệu trong biến toàn cục cấp module, và `ete.clear_data()` xoá sạch nó mỗi lần chạy. Hai job dùng chung tiến trình sẽ **trả kết quả của nhau mà không báo lỗi bất kỳ**. Vì vậy dùng `ProcessPoolExecutor`, **tuyệt đối không dùng thread**.

Ràng buộc này được test bảo vệ:
```bash
pytest server/tests/ -v
```
`test_threads_do_corrupt_jobs` cố tình khẳng định thread **làm hỏng** dữ liệu — nếu test đó thất bại nghĩa là oemer đã bỏ biến toàn cục, khi đó mới được xem xét lại thiết kế.

**2. Không dùng Redis/Celery.** Yêu cầu bắt buộc duy nhất là cô lập tiến trình, thư viện chuẩn đã làm được. Tiêu chí để biết khi nào cần nâng cấp: `../plans/20260725_2338-act-don-gian-hoa-hang-doi.md`.

**3. Bake sẵn checkpoint vào Docker image.** Hàm tải của oemer dùng chunk 512 byte nên cực chậm (5 phút mới được 19% của 1 file, trong khi `curl` tải 109 MB hết 20 giây).

**4. Ghim `opencv-python-headless<5`.** OpenCV 5 làm pipeline sập, và kể cả sau khi vá thì kết quả vẫn khác ~7% so với OpenCV 4. Chi tiết: `../reports/20260725_2358-loi-moi-truong-opencv5.md`.

## Hiệu năng thực đo
Transcribe 1 ảnh: **~4 phút** trên CPU Apple Silicon. Đây là lý do API không xử lý đồng bộ trong request mà phải dùng job + polling.
