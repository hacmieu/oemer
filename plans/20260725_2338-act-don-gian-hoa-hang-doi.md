# ACT: Đơn giản hoá hàng đợi — bỏ Redis/Celery khỏi MVP

- **Ghi ngày**: 2026-07-25 23:38
- **Giai đoạn PDCA**: ACT (điều chỉnh kế hoạch sau CHECK)
- **Đầu vào**:
  - CHECK thực nghiệm: `reports/20260725_2338-check-thuc-nghiem-race-condition.md`
  - Phản hồi: *"Redis Celery dùng để làm gì?"* → nghi vấn về việc phức tạp hoá không cần thiết.

## 1. Redis và Celery thực chất làm gì?

**Vấn đề gốc**: transcribe mất **3–5 phút/ảnh**. Một HTTP request không chờ được lâu như vậy (trình duyệt và proxy thường timeout sau 30–60 giây). Nên bắt buộc tách làm 2 nhịp:
- `POST /jobs` → trả `job_id` **ngay lập tức**.
- Việc nặng chạy nền ở chỗ khác; frontend hỏi thăm `GET /jobs/{id}` cho tới khi xong.

Trong mô hình đó:

| Thành phần | Vai trò thật sự |
|---|---|
| **Redis** | (1) **Hộp thư chung** để tiến trình API gửi "phiếu việc" cho tiến trình worker — vì chúng là 2 tiến trình tách biệt, không dùng chung biến được. (2) **Bảng trạng thái** job để frontend hỏi thăm. |
| **Celery / RQ** | Thư viện Python quản lý hộp thư đó: đẩy việc, lấy việc, **retry khi lỗi**, **timeout**, lưu kết quả, chạy nhiều worker. |

## 2. Đánh giá lại: MVP có cần không? → **KHÔNG**

Cái ta **thực sự bắt buộc** phải có (theo CHECK) chỉ là **cô lập tiến trình**. Python có sẵn công cụ làm việc đó, không cần cài thêm gì:

```python
from concurrent.futures import ProcessPoolExecutor
# Mỗi job chạy trong 1 tiến trình con riêng -> _layers riêng biệt -> hết tranh chấp
executor = ProcessPoolExecutor(max_workers=2)
```

`ProcessPoolExecutor` nằm trong thư viện chuẩn, cho đúng thứ ta cần. Trạng thái job thì lưu **SQLite**. Kết quả: **0 service phụ, 0 hạ tầng thêm**.

### So sánh

| | ProcessPoolExecutor + SQLite | Redis + Celery/RQ |
|---|---|---|
| Cô lập tiến trình (yêu cầu bắt buộc) | ✅ | ✅ |
| Số service phải vận hành | **0** | 2 (Redis + worker) |
| Job sống sót khi restart API | ❌ | ✅ |
| Worker chạy trên nhiều máy | ❌ | ✅ |
| Retry / ưu tiên / hẹn giờ | Tự viết | ✅ Có sẵn |
| Độ phức tạp vận hành | Thấp | Trung bình |

## 3. Quyết định

> **Chu kỳ 1 (MVP)**: dùng `ProcessPoolExecutor` + SQLite. **Bỏ Redis và Celery.**
>
> **Chu kỳ 2**: chỉ nâng lên Redis + RQ **khi số liệu thật chứng minh là cần**.

### Tiêu chí kích hoạt nâng cấp (đo được, không cảm tính)
Chuyển sang Redis + RQ khi **một trong các điều sau** xảy ra:
- Cần chạy worker trên **máy khác** với máy chạy API (ví dụ tách máy GPU).
- Job bị **mất khi deploy/restart** gây phàn nàn thực tế.
- Cần **retry tự động** hoặc **ưu tiên** job.
- Hàng đợi thường xuyên dài > 20 job.

Thiết kế đảm bảo đổi được dễ dàng: toàn bộ logic chạy job đặt sau **một interface duy nhất** (`JobQueue` với `enqueue()` / `get_status()`), nên thay backend hàng đợi không phải sửa API hay frontend.

## 4. Kiến trúc Chu kỳ 1 sau khi sửa

```
[Next.js]
    │ REST
[FastAPI]  ──> ProcessPoolExecutor (max_workers = số nhân CPU / 2)
    │                  │ mỗi job = 1 tiến trình con (_layers độc lập)
[SQLite: job status]  ─┘
[Thư mục uploads/ + results/]
```

Hiển thị bản nhạc + phát nhạc chạy **hoàn toàn phía trình duyệt** (OSMD + audio player) — backend chỉ cần trả file `.musicxml`.

## 5. Bổ sung bắt buộc vào Chu kỳ 1

Thêm **test hồi quy đồng thời** (bảo vệ đúng lỗi đã chứng minh ở CHECK):
- [ ] Upload **2 ảnh khác nhau** cùng lúc → 2 kết quả phải khớp đúng với 2 ảnh đầu vào.
- [ ] Test này phải **thất bại** nếu ai đó đổi sang thread — tức là nó thực sự bảo vệ được ràng buộc.

## 6. Điều KHÔNG thay đổi
Các lựa chọn còn lại trong `plans/20260725_2327-pdca-frontend-oemer-web.md` giữ nguyên: OSMD để hiển thị, `@isamu/osmd-audio-player` để phát nhạc, Next.js + Tailwind + shadcn/ui cho giao diện, và SPIKE vẫn là việc đầu tiên phải làm.
