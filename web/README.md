# web/ — Frontend cho oemer

Thư mục dành cho phần giao diện web. Hiện mới có các SPIKE kiểm chứng kỹ thuật, **chưa có ứng dụng hoàn chỉnh**.

Kế hoạch: `../plans/20260725_2327-pdca-frontend-oemer-web.md`

## `spike-vite/` — SPIKE chính (kết quả có giá trị) ✅

Kiểm chứng OpenSheetMusicDisplay + audio player đọc và phát được `.musicxml` do oemer sinh ra.
**Kết quả: ĐẠT** — render 183 ms, phát nhạc chạy. Chi tiết: `../reports/20260725_2358-ket-qua-spike-osmd-playback.md`

```bash
# 1. Tạo file mẫu bằng chính oemer (file .musicxml bị gitignore nên phải tự sinh)
oemer ../figures/tabi.jpg -o /tmp/oemer_out
mkdir -p spike-vite/public && cp /tmp/oemer_out/tabi.musicxml spike-vite/public/sample.musicxml

# 2. Chạy
cd spike-vite && npm install && npm run dev    # http://localhost:8778
```

## `spike/` — SPIKE bằng CDN (giữ làm đối chứng) ⚠️

Bản không cần build, dùng `esm.sh`. **Audio player KHÔNG chạy** ở bản này do lỗi interop CJS của esm.sh — giữ lại để nhớ bài học: **luôn kiểm chứng thư viện bằng bundler thật, đừng kết luận từ CDN.**

## Phiên bản đã kiểm chứng — phải ghim

```
opensheetmusicdisplay      1.9.7   (chưa nâng lên 2.1.0)
@isamu/osmd-audio-player   1.0.0   (yêu cầu OSMD ^1.9.7)
```

Backend cũng cần ghim `opencv-python-headless<5` — OpenCV 5 làm sập pipeline oemer
(xem `../reports/20260725_2358-loi-moi-truong-opencv5.md`).
