# Memory: Kết quả SPIKE + Các phiên bản đã kiểm chứng

- **Ghi ngày**: 2026-07-25 23:58

## ✅ SPIKE ĐẠT — nghe nhạc trên web là khả thi

Đã chạy pipeline oemer thật → `tabi.musicxml` (107,7 KB) → nạp lên web:
- OSMD parse + render: **OK, 183 ms**
- Audio player `loadScore`: **OK**
- Tự nhận đúng nhạc cụ Piano, nạp soundfont `acoustic_grand_piano`

⇒ **Không cần** phương án dự phòng server render MIDI→MP3. Rủi ro số 1 của kế hoạch đã gỡ.

## ⚠️ BÀI HỌC LỚN: phải test bằng bundler thật, đừng test bằng CDN

| Cách thử | OSMD | Audio player |
|---|---|---|
| CDN `esm.sh`, không build | ✅ OK | ❌ `g.instrument is not a function` |
| **Vite + npm (bundler thật)** | ✅ OK | ✅ **OK** |

`esm.sh` gói CJS sai interop (`OpenSheetMusicDisplay` nằm trong `default`, `soundfont-player` hỏng). **Nếu tin kết quả CDN thì đã kết luận nhầm "không tương thích"** và đi đường vòng vô ích.

## 📌 PHIÊN BẢN ĐÃ KIỂM CHỨNG — PHẢI GHIM

```
opensheetmusicdisplay      1.9.7      (KHÔNG nâng lên 2.1.0 khi chưa test lại)
@isamu/osmd-audio-player   1.0.0      (yêu cầu OSMD ^1.9.7)
opencv-python-headless     >=4.5.3.56,<5
```

## 🛑 Lỗi chặn đã gặp: OpenCV 5 làm sập pipeline
`cv2.HoughLinesP` đổi kiểu trả về `(N,1,4)` → `(N,4)` ở OpenCV 5, làm `bbox.py:125` ném `IndexError`. `setup.py` không chặn trần nên pip cài nhầm 5.0.0.93.
- Khắc phục cục bộ: hạ về OpenCV **4.13.0** → chạy thông.
- **Chưa sửa vào `setup.py`** — cần quyết định (ghim `<5` hay sửa `find_lines`).

## 📊 Số đo thực tế (dùng để thiết kế UX chờ)
- Transcribe 1 ảnh (`figures/tabi.jpg`) trên CPU Apple Silicon: **4 phút 07 giây**, 331% CPU.
- MusicXML sinh ra: 107,7 KB. OSMD render: 183 ms (rất nhanh, không phải nút thắt).
- ⚠️ `--save-cache` tạo file `.pkl` nặng **147 MB** cho 1 ảnh → **không dùng trên production**, hoặc phải dọn dẹp.

## Việc cần làm ở Chu kỳ 2 (phát sinh từ SPIKE)
1. Soundfont đang tải từ `gleitz.github.io` (GitHub Pages cá nhân) → **phải tự host**.
2. `npm audit` báo 9 lỗ hổng (8 high, 1 critical) trong cây phụ thuộc → rà trước khi lên production.

## Môi trường dev hiện có
- `.venv/` Python 3.13.5, `pip install -e .`, OpenCV đã hạ về 4.13.0.
- Checkpoint `.onnx` đã tải sẵn vào `oemer/checkpoints/{unet_big,seg_net}/model.onnx`.
- `web/spike-vite/` — spike Vite (**bản có giá trị**), chạy `npm run dev` (cổng 8778).
- `web/spike/` — spike CDN, giữ làm đối chứng cho bài học interop.
- File mẫu: `/tmp/oemer_out/tabi.musicxml` (lưu ý `*.musicxml` bị gitignore).
