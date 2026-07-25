# Backend MVP + Test đồng thời end-to-end

- **Thời gian**: 2026-07-26 00:24
- **Giai đoạn PDCA**: DO → CHECK (Chu kỳ 1)
- **Phạm vi**: sửa lỗi OpenCV, dựng backend, chứng minh hết tranh chấp dữ liệu

## 1. Sửa lỗi OpenCV (làm cả hai cách theo yêu cầu)

### Đã sửa
**a) Vá code** — `oemer/bbox.py`, chấp nhận cả 2 dạng trả về:
```python
for line in lines:
    # OpenCV < 5 returns shape (N, 1, 4), OpenCV >= 5 returns (N, 4).
    if line.ndim > 1:
        line = line[0]
```
`find_lines()` được gọi từ 3 nơi (`staffline_extraction`, `symbol_extraction`, `barline_extraction`) nhưng đều dùng chung định dạng đầu ra, nên sửa một chỗ là đủ.

**b) Ghim phiên bản** — `setup.py`: `"opencv-python-headless>=4.5.3.56,<5"`.

### CHECK: vì sao vẫn giữ ghim `<5` dù đã vá code?

Chạy lại pipeline trên cùng một ảnh, dùng cache `.pkl` để loại bỏ biến động từ inference:

| So sánh | Số dòng khác (trên 4890 dòng) |
|---|---|
| 2 lần chạy, **cùng** OpenCV 5 | **0** |
| OpenCV 5 **vs** OpenCV 4 | **345 (~7%)** |

Lần chạy đôi trên OpenCV 5 cho kết quả **giống hệt nhau** ⇒ pipeline **tất định**, nên 345 dòng khác biệt kia **không phải nhiễu ngẫu nhiên** mà là **khác biệt thật do phiên bản OpenCV**.

⇒ Bản vá làm pipeline **chạy được** trên OpenCV 5, nhưng **bản nhạc cho ra khác đi ~7%**. Chưa có bộ đánh giá đối chiếu nên **không biết là tốt hơn hay tệ hơn**. Giữ ghim `<5` cho tới khi đánh giá được chất lượng. Bản vá giúp việc gỡ ghim sau này chỉ còn là bài toán đo đạc.

Không hồi quy trên OpenCV 4: pipeline chạy xong, ra MusicXML bình thường.

## 2. Backend đã dựng

```
server/
  transcribe.py   # bọc ete.extract, bỏ argparse
  jobs.py         # JobQueue: ProcessPoolExecutor + SQLite
  app.py          # FastAPI
  tests/          # test hồi quy cô lập tiến trình
```

Không dùng Redis/Celery, theo quyết định ở `plans/20260725_2338-act-don-gian-hoa-hang-doi.md`.

| Method | Đường dẫn | Kết quả kiểm thử |
|---|---|---|
| `GET` | `/api/health` | ✅ `{"ok":true,"checkpoints":true}` |
| `POST` | `/api/jobs` | ✅ `202 {job_id, status}` |
| `GET` | `/api/jobs/{id}` | ✅ trả `queued`/`running`/`done`/`failed` |
| `GET` | `/api/jobs/{id}/musicxml` | ✅ tải được file |
| `GET` | `/api/jobs/{id}/preview` | ✅ PNG 1884×1950 |

Kiểm thử đầu vào xấu: file `.txt` → `415` kèm danh sách định dạng hợp lệ; job không tồn tại → `404`.

## 3. ✅ CHECK quan trọng nhất: test đồng thời

### 3a. Test hồi quy tự động (nhanh, chạy trong CI)

`server/tests/test_isolation.py` — chạy trên **chính module `oemer.layers` thật**, không dùng đồ giả:

```
test_process_pool_keeps_jobs_isolated  PASSED
test_threads_do_corrupt_jobs           PASSED
```

Test thứ hai **cố tình khẳng định thread LÀM HỎNG dữ liệu**. Mục đích: chứng minh test thứ nhất không rỗng nghĩa. Nếu một ngày test thứ hai thất bại, nghĩa là oemer đã bỏ biến toàn cục và khi đó mới được xem xét lại thiết kế.

### 3b. Test end-to-end với 2 ảnh khác nhau qua API thật

Upload sát nhau 2 ảnh **khác nhau rõ rệt**: `tabi.jpg` (đầy đủ) và bản **cắt nửa trên**. Cả hai chạy song song trên 2 worker (`created_at` trùng nhau: `17:15:01`).

| Đầu vào | Ô nhịp | Nốt | Dung lượng |
|---|---|---|---|
| Ảnh đầy đủ | **28** | **360** | 110.299 ký tự |
| Ảnh cắt nửa | **14** | **173** | 52.625 ký tự |

**Kết quả: ĐẠT.** Ảnh cắt nửa cho ra **đúng một nửa** số ô nhịp (14/28) và xấp xỉ nửa số nốt. Nếu bị lẫn dữ liệu thì hai kết quả đã giống hệt nhau.

⇒ **Lỗi tranh chấp đã được xử lý triệt để trên đường đi thật của người dùng**, không chỉ trong test đơn vị.

## 4. ⚠️ Phát hiện mới về khả năng chịu tải

| Cách chạy | Tổng thời gian |
|---|---|
| 1 job đơn lẻ | ~4 phút |
| 2 job song song (2 worker) | **8 phút 41 giây** |

**Tăng worker KHÔNG tăng thông lượng trên một máy.** Pipeline vốn đã dùng ~331% CPU (tự chạy đa luồng bên trong), nên 2 worker chỉ giành CPU của nhau. Chạy tuần tự 2 job cũng mất ~8 phút — gần như y hệt.

**Hệ quả cho Chu kỳ 2**: mục tiêu "20 người đồng thời" **không thể** đạt bằng cách tăng `OEMER_MAX_WORKERS` trên một máy. Bắt buộc phải **thêm máy** (lúc đó Redis + RQ mới thực sự cần — đúng tiêu chí kích hoạt đã đặt ra). Lợi ích duy nhất của nhiều worker trên 1 máy là **công bằng**: người thứ hai thấy job của mình chạy ngay thay vì xếp hàng.

Cần đo lại trên máy có GPU trước khi chốt cấu hình.

## 5. Việc cần xử lý sau
- Ảnh preview nặng **4 MB** → phải nén/thu nhỏ trước khi trả cho web.
- Chưa có dọn dẹp file cũ theo TTL (Chu kỳ 2).
- Chưa có Dockerfile.
- Chưa có frontend.

## Liên quan
- Hướng dẫn backend: `../server/README.md`
- Ràng buộc gốc: `20260725_2338-check-thuc-nghiem-race-condition.md`
- Lỗi OpenCV: `20260725_2358-loi-moi-truong-opencv5.md`
