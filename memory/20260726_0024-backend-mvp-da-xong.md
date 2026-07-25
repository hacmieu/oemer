# Memory: Backend MVP đã xong + Giới hạn thông lượng

- **Ghi ngày**: 2026-07-26 00:24

## Đã hoàn thành

**Sửa OpenCV (cả 2 cách)**
- `oemer/bbox.py::find_lines` nhận cả `(N,1,4)` và `(N,4)` → chạy được trên OpenCV 4 lẫn 5.
- `setup.py` ghim `opencv-python-headless>=4.5.3.56,<5`.
- ⚠️ **Vẫn giữ ghim** vì: pipeline tất định (2 lần chạy cùng phiên bản ra kết quả giống hệt), nhưng OpenCV 5 vs 4 **khác 345/4890 dòng (~7%)**. Chưa biết tốt hơn hay tệ hơn nên chưa gỡ ghim.

**Backend** (`server/`)
- `transcribe.py` — bọc `ete.extract`, bỏ argparse.
- `jobs.py` — `JobQueue` = `ProcessPoolExecutor` + SQLite (WAL). Không Redis/Celery.
- `app.py` — FastAPI: `/api/health`, `POST /api/jobs`, `GET /api/jobs/{id}`, `/musicxml`, `/preview`.
- Chạy: `uvicorn server.app:app --port 8500`. Tài liệu: `server/README.md`.

## ✅ Đã chứng minh hết lỗi tranh chấp dữ liệu

**Test tự động** (`server/tests/`, chạy ~8 giây):
- `test_process_pool_keeps_jobs_isolated` PASSED
- `test_threads_do_corrupt_jobs` PASSED ← cố tình khẳng định thread làm hỏng, để test đầu không rỗng nghĩa

**Test end-to-end thật** qua API, 2 ảnh khác nhau upload đồng thời:
| Đầu vào | Ô nhịp | Nốt |
|---|---|---|
| tabi.jpg (đầy đủ) | 28 | 360 |
| tabi cắt nửa | 14 | 173 |

Đúng một nửa ⇒ mỗi job trả đúng kết quả ảnh của nó. Nếu lẫn thì đã giống hệt nhau.

## ⚠️ GIỚI HẠN THÔNG LƯỢNG — nhớ kỹ cho Chu kỳ 2

| Cách chạy | Thời gian |
|---|---|
| 1 job | ~4 phút |
| 2 job song song | **8 phút 41 giây** |

**Tăng worker KHÔNG tăng thông lượng trên 1 máy.** Pipeline đã tự dùng ~331% CPU nên các worker chỉ giành CPU của nhau. Chạy tuần tự cũng ~8 phút.

⇒ Mục tiêu "20 người đồng thời" **bắt buộc phải thêm máy**, không thể chỉ tăng `OEMER_MAX_WORKERS`. Đây chính là lúc tiêu chí "worker chạy khác máy" được kích hoạt ⇒ **khi đó mới cần Redis + RQ**.
⇒ Lợi ích duy nhất của nhiều worker trên 1 máy là **công bằng** (người thứ 2 thấy job chạy ngay thay vì xếp hàng).
⇒ Cần đo lại trên máy GPU trước khi chốt cấu hình.

## Còn nợ
- Ảnh preview nặng **4 MB** → phải nén trước khi trả cho web.
- Chưa dọn file cũ theo TTL.
- Chưa có Dockerfile.
- **Chưa có frontend** ← việc tiếp theo.

## Lệnh hay dùng
```bash
.venv/bin/python -m pytest server/tests/ -v
OEMER_DATA_DIR=/tmp/oemer_api_data .venv/bin/uvicorn server.app:app --port 8500
```
