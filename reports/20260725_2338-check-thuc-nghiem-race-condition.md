# CHECK: Thực nghiệm chứng minh lỗi tranh chấp dữ liệu giữa các job

- **Thời gian**: 2026-07-25 23:38
- **Giai đoạn PDCA**: CHECK (kiểm chứng giả định của kế hoạch)
- **Lý do làm**: Nghi vấn hợp lý được nêu ra — *"đè làm sao được mà đè?"*. Cần bằng chứng thay vì suy đoán.

## Kết luận

**Lỗi có thật, và cơ chế KHÔNG phải "đè" như tôi mô tả ban đầu.** Cách diễn đạt cũ sai; cơ chế thật nguy hiểm hơn vì nó **không hề báo lỗi**.

## Thực nghiệm

Nạp trực tiếp file thật `oemer/layers.py`, mô phỏng đúng trình tự mà `ete.py` thực hiện (`clear_data()` → `register_layer()` → xử lý → `get_layer()`), cho 2 job chạy lệch nhau 0,1 giây trong **cùng một tiến trình**:

```python
def job(name, value, delay):
    for l in layers.list_layers():      # ete.main() gọi clear_data()
        layers.delete_layer(l)
    layers.register_layer("staff_pred", np.full((2, 2), value))
    time.sleep(delay)                    # mô phỏng pipeline chạy vài phút
    got = layers.get_layer("staff_pred")[0][0]
```

### Kết quả chạy thật

```
[job B (ảnh 2)] ghi 222, đọc lại 222  => ĐÚNG
[job A (ảnh 1)] ghi 111, đọc lại 222  => SAI -> lấy nhầm dữ liệu của job khác
```

**Job A ghi dữ liệu của ảnh 1, nhưng đọc ra dữ liệu của ảnh 2.**

Trong app thật: **người dùng A upload bản nhạc của mình và nhận về kết quả bản nhạc của người dùng B.** Không có exception, không có log lỗi — kết quả sai được trả về như thể thành công.

## Cơ chế chính xác (đính chính)

Thủ phạm **không phải** `register_layer` ghi đè. Thực tế `register_layer` khi trùng tên chỉ `print` rồi return, **không ghi gì cả**:

```14:21:oemer/layers.py
def register_layer(name: str, layer: ndarray) -> None:
    if name in _layers:
        print("Name already registered! Choose another name or delete it first.")
        return
```

Thủ phạm là **`clear_data()`** — `ete.main()` gọi nó ở đầu mỗi lần chạy, và nó xoá **toàn bộ** `_layers` của tiến trình, kể cả dữ liệu của job đang chạy dở:

```43:46:oemer/ete.py
def clear_data() -> None:
    lls = layers.list_layers()
    for l in lls:
        layers.delete_layer(l)
```

Diễn biến:
1. Job A: `clear_data()` → `register_layer("staff_pred", <ảnh 1>)` → bắt đầu chạy (mất vài phút).
2. Job B chen vào: `clear_data()` **xoá sạch layer của job A** → `register_layer("staff_pred", <ảnh 2>)`.
3. Job A chạy tiếp, gọi `get_layer("staff_pred")` → **nhận dữ liệu của ảnh 2**.

## Hai kiểu hỏng có thể xảy ra

| Kiểu | Nguyên nhân | Biểu hiện |
|---|---|---|
| **Trả kết quả sai (nguy hiểm nhất)** | Job B đã kịp `register_layer` trước khi job A đọc | Im lặng, không lỗi. Người dùng nhận nhầm bản nhạc của người khác. |
| **Sập job** | Job A đọc đúng lúc job B vừa `clear_data()` mà chưa `register_layer` | `KeyError: The given layer name not registered` |

## Khi nào lỗi này KHÔNG xảy ra
- Chạy CLI 1 lần 1 ảnh (cách dùng hiện tại của `oemer`) → hoàn toàn an toàn. Đây là lý do lỗi chưa từng lộ ra.
- Mỗi job chạy trong **một tiến trình riêng** → mỗi tiến trình có `_layers` riêng, không đụng nhau.

## Hệ quả cho thiết kế
**Cô lập theo tiến trình là bắt buộc, không phải tuỳ chọn.** Cụ thể:
- ❌ KHÔNG được gọi pipeline trực tiếp trong endpoint FastAPI (uvicorn chạy nhiều request đồng thời trong 1 tiến trình).
- ❌ KHÔNG được dùng thread (`ThreadPoolExecutor`, `BackgroundTasks`).
- ✅ PHẢI dùng tiến trình con riêng cho mỗi job.

## Việc cần thêm vào kế hoạch
Bổ sung **test hồi quy đồng thời** vào Chu kỳ 1: upload 2 ảnh **khác nhau** cùng lúc, khẳng định 2 kết quả khớp với 2 ảnh đầu vào. Đây là bài test bảo vệ đúng lỗi vừa chứng minh.

## Liên quan
- Kế hoạch: `plans/20260725_2327-pdca-frontend-oemer-web.md`
- ACT tương ứng: `plans/20260725_2338-act-don-gian-hoa-hang-doi.md`
