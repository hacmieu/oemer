# Lỗi chặn: oemer không chạy được với OpenCV 5.x

- **Thời gian**: 2026-07-25 23:58
- **Mức độ**: Chặn hoàn toàn (pipeline sập, không ra kết quả)
- **Đã khắc phục cục bộ**: có (hạ về OpenCV 4.13.0)

## Triệu chứng

Cài đặt sạch bằng `pip install -e .` rồi chạy `oemer figures/tabi.jpg` → sập sau ~3,5 phút (tức là sau khi đã tốn toàn bộ thời gian inference):

```
File "oemer/staffline_extraction.py", line 618, in further_infer_track_nums
  lines = find_lines(mix)
File "oemer/bbox.py", line 125, in find_lines
  top_x, bt_x = (line[0], line[2]) if line[0] < line[2] else (line[2], line[0])
IndexError: invalid index to scalar variable.
```

## Nguyên nhân gốc

`cv2.HoughLinesP` **đổi kiểu trả về** giữa OpenCV 4 và 5:

| OpenCV | Kiểu trả về |
|---|---|
| 4.x | `(N, 1, 4)` |
| **5.x** | **`(N, 4)`** |

Đã kiểm chứng trực tiếp:
```
OpenCV: 5.0.0
shape tra ve: (5, 4)
lines[0]: [20 51 90 49] | lines[0][0]: 20
```

Code oemer giả định dạng cũ:

```120:127:oemer/bbox.py
    lines = cv2.HoughLinesP(data.astype(np.uint8), 1, np.pi/180, 50, None, min_len, max_gap)
    new_line = []
    if lines is not None:
        for line in lines:
            line = line[0]
            top_x, bt_x = (line[0], line[2]) if line[0] < line[2] else (line[2], line[0])
```

Với OpenCV 5, `line[0]` trả về **số vô hướng** (`20`) thay vì mảng 4 phần tử, nên `line[0]` tiếp theo ném `IndexError`.

## Vì sao lại cài nhầm bản 5?

`setup.py` khai báo **không chặn trần**:

```python
"opencv-python-headless>=4.5.3.56",
```

Nên `pip` tự động lấy bản mới nhất là **5.0.0.93**.

## Khắc phục

**Đã làm (cục bộ)**: `pip install "opencv-python-headless>=4.5.3.56,<5"` → OpenCV 4.13.0 → pipeline chạy thông, ra `.musicxml` thành công.

**Cần làm (chính thức)** — chọn 1 trong 2:
1. **Ghim phiên bản** trong `setup.py`: `"opencv-python-headless>=4.5.3.56,<5"`. Ít rủi ro nhất, đúng ý đồ ban đầu của tác giả.
2. **Sửa `find_lines`** để chấp nhận cả 2 dạng, rồi mới nới trần. Bền hơn nhưng cần kiểm thử lại toàn bộ pipeline.

Khuyến nghị: làm **cách 1 ngay** (mở khoá công việc), cân nhắc cách 2 sau.

⚠️ Dù chọn cách nào, **Docker image bắt buộc phải ghim phiên bản OpenCV**, nếu không việc build lại sau vài tháng sẽ hỏng đúng kiểu này.

## Phát hiện kèm theo: downloader checkpoint quá chậm

`ete.download_file()` dùng `chunk_size = 2**9` (**512 byte**) và `print` mỗi vòng lặp:

| Cách tải | Kết quả |
|---|---|
| Downloader của oemer | 19% của file 70 MB sau **~5 phút** |
| `curl` | **cả 109 MB trong ~20 giây** |

Ngoài ra `main()` tải cả 2 file `.h5` (TensorFlow, ~110 MB) dù mặc định chạy Onnxruntime → lãng phí băng thông.

⇒ **Docker image phải bake sẵn 2 file `.onnx`.** `main()` chỉ kiểm tra `unet_big/model.onnx` có tồn tại hay không, nên có sẵn 2 file này là bỏ qua toàn bộ bước tải.
