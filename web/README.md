# web/ — Frontend cho oemer

Ứng dụng Next.js: tải ảnh bản nhạc lên, theo dõi tiến độ, xem bản nhạc, **nghe**, và tải MusicXML về.

Kế hoạch: `../plans/20260725_2327-pdca-frontend-oemer-web.md` ·
Báo cáo: `../reports/20260726_0059-frontend-mvp-va-loi-phat-hien.md`

## Chạy thử

Cần backend chạy trước (xem `../server/README.md`).

```bash
# Backend, ở thư mục gốc repo
OEMER_CORS_ORIGINS=http://localhost:3000 uvicorn server.app:app --port 8500

# Frontend
cd web && npm install && npm run dev     # http://localhost:3000
```

`OEMER_CORS_ORIGINS` phải khớp **chính xác** origin của frontend. `localhost` và `127.0.0.1` là hai origin khác nhau; sai một ly là dính lỗi CORS.

| Biến môi trường | Mặc định | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8500` | Địa chỉ backend |

## Cấu trúc

```
app/page.tsx              Trang chủ, khung kéo thả
app/jobs/[id]/page.tsx    Trang một lần nhận diện
components/
  upload-dropzone.tsx     Chọn/kéo ảnh, kiểm tra ngay tại máy
  job-view.tsx            Hỏi trạng thái mỗi 2 giây
  score-result.tsx        Tiêu đề, nút tải, nạp MusicXML
  score-viewer.tsx        OSMD + trình phát
lib/api.ts                Gọi API, bọc lỗi thành tiếng Việt
spikes/                   Mã thí nghiệm cũ, giữ làm đối chứng
```

## Quy ước thiết kế

- Trung tính **zinc**, một màu nhấn **hổ phách** duy nhất, chỉ dùng cho trạng thái đang chạy và con trỏ phát nhạc.
- Bo góc chỉ có hai giá trị: nút 8px, panel 12px.
- Nút chính đảo màu mực/nền thay vì dùng màu nhấn, để tương phản vượt AA ở cả hai chế độ sáng tối.
- Bản nhạc luôn nằm trên nền giấy trắng, **kể cả chế độ tối** (class `.paper`). Nó là tài liệu, không phải bề mặt giao diện.
- **Không hiển thị phần trăm tiến độ.** Pipeline không báo được nó đang ở bước nào, nên mọi con số phần trăm đều là bịa. Chỉ hiện thời gian đã chạy thật và mức thường gặp.

## ⚠️ Cạm bẫy OSMD — đọc trước khi sửa `score-viewer.tsx`

Con trỏ phát nhạc từng vô hình rồi đứng yên vì **bốn** nguyên nhân chồng lên nhau. Mỗi dòng dưới đây tương ứng một dòng code trông có vẻ thừa nhưng không hề thừa:

1. **Đừng bật `autoResize`.** OSMD dựng lại đối tượng con trỏ khi bố cục đổi, còn trình phát vẫn giữ tham chiếu cũ ⇒ nhạc chạy mà con trỏ đứng yên, **không báo lỗi gì**. Đổi lại là hỏng ngay.
2. **`keepCursorTallEnough()` là bắt buộc.** OSMD kéo giãn ảnh con trỏ cao 1px bằng thuộc tính HTML `height`, còn preflight của Tailwind đặt `height: auto` cho mọi ảnh nên bóp nó về 1px. CSS không đọc được thuộc tính HTML nên phải sao chép sang style inline. Nó theo dõi **cả vùng chứa** vì phần tử con trỏ có thể bị thay mới.
3. **`z-index: 0 !important` trong `globals.css` là bắt buộc.** OSMD đặt `z-index: -1` bằng style inline (chỉ `!important` mới đè được), giả định phía sau không có gì — nhưng nền trắng `.paper` sẽ nuốt mất nó.
4. **Phải gọi `cursor.reset()` rồi `cursor.show()` sau `render()`**, nếu không OSMD không dựng ảnh con trỏ.

Ngoài ra: **`overflow-hidden` vô hiệu hoá `position: sticky`** của phần tử con — đó là lý do panel bao ngoài bản nhạc trong `score-result.tsx` không dùng nó, vì thanh điều khiển phát nhạc cần bám lại khi trang tự cuộn theo con trỏ.

## Phiên bản đã kiểm chứng — phải ghim

```
opensheetmusicdisplay      1.9.7   (chưa nâng lên 2.1.0)
@isamu/osmd-audio-player   1.0.0   (yêu cầu OSMD ^1.9.7)
```

Backend cũng cần ghim `opencv-python-headless<5` — OpenCV 5 làm sập pipeline oemer
(xem `../reports/20260725_2358-loi-moi-truong-opencv5.md`).

## Còn nợ

- Soundfont đang tải từ `gleitz.github.io`, phải tự host trước khi lên production.
- Chưa có Dockerfile.

## `spikes/` — mã thí nghiệm cũ

`spikes/vite/` là SPIKE đã chứng minh OSMD + trình phát chạy được với MusicXML của oemer.
`spikes/cdn/` dùng `esm.sh` và **audio player không chạy** do lỗi interop CJS — giữ lại để nhớ bài học: **luôn kiểm chứng thư viện bằng bundler thật, đừng kết luận từ CDN.**
