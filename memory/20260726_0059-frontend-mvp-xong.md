# Frontend MVP đã xong — Chu kỳ 1 hoàn tất

**Thời gian**: 2026-07-26 00:59

## Trạng thái: Chu kỳ 1 (MVP) ĐÃ XONG ✅

Luồng đầy đủ chạy thật: upload → hàng đợi → theo dõi → xem bản nhạc → **nghe** → tải MusicXML.

## Cấu trúc code hiện tại

```
server/          FastAPI + ProcessPoolExecutor + SQLite   (Chu kỳ 1, xong)
web/             Next.js 16 + TypeScript + Tailwind 4     (Chu kỳ 1, xong)
web/spikes/      Mã thí nghiệm, giữ làm đối chứng
```

## Chạy thử

```bash
# Backend
OEMER_CORS_ORIGINS=http://localhost:4321 .venv/bin/uvicorn server.app:app --port 8500
# Frontend
cd web && npx next dev --port 4321
```

⚠️ **Cổng 3000 và 3100 trên máy này bị Cursor chiếm** để chuyển tiếp cổng — Next.js bind vào đó sẽ trả về rỗng, không báo lỗi gì. Dùng cổng khác (4321). Mặc định trong code vẫn là 3000 vì đó là chuẩn Next.js.

Nhớ đặt `OEMER_CORS_ORIGINS` khớp **chính xác** origin của frontend: `localhost` và `127.0.0.1` là **hai origin khác nhau**, sai là dính lỗi CORS.

## Quy ước thiết kế đã chốt

- Nền sáng, trung tính **zinc**, một màu nhấn **hổ phách** duy nhất — chỉ dùng cho trạng thái đang chạy và con trỏ phát nhạc.
- Bo góc: nút 8px, panel 12px. Không có giá trị thứ ba.
- Nút chính đảo màu mực/nền, **không** dùng màu nhấn, để tương phản luôn vượt AA ở cả hai chế độ.
- Bản nhạc luôn nằm trên **nền giấy trắng kể cả chế độ tối** (class `.paper`) — nó là tài liệu, không phải bề mặt giao diện.
- **Không bịa phần trăm tiến độ**: pipeline không báo được bước nào, nên chỉ hiện thời gian đã chạy thật + mức thường gặp 4:10.

## ⚠️ Cạm bẫy OSMD (đã trả giá, đừng lặp lại)

1. **`autoResize: true` làm hỏng con trỏ phát nhạc.** OSMD dựng lại đối tượng con trỏ khi bố cục đổi, trình phát vẫn giữ tham chiếu cũ ⇒ nhạc chạy mà con trỏ đứng yên, **không báo lỗi**. Đang để `autoResize: false`; đổi lại là hỏng.
2. **Preflight của Tailwind bóp con trỏ còn 1px.** OSMD kéo giãn ảnh cao 1px bằng thuộc tính HTML `height`, còn Tailwind đặt `height: auto` cho mọi ảnh. CSS **không đọc được** thuộc tính HTML, nên phải sao chép sang style inline bằng `MutationObserver` (xem `keepCursorTallEnough`).
3. **`z-index: -1` của con trỏ là style inline** ⇒ chỉ `!important` mới đè được. Cần đè vì nền giấy trắng `.paper` sẽ che mất nó.
4. Phải gọi `cursor.reset()` rồi `cursor.show()` **sau** `render()` thì OSMD mới dựng ảnh con trỏ.
5. **`overflow-hidden` vô hiệu hoá `position: sticky`** của phần tử con — đây là lý do panel bao ngoài bản nhạc không được dùng nó.

## Bài học từ lần kiểm thử này

1. **Lưu file upload theo mã job là sai** — oemer lấy **tên file làm tiêu đề bản nhạc**, nên bản nhạc hiện tiêu đề là chuỗi hex. Phải lưu `uploads/{job_id}/{tên gốc}`.
2. **Tên file do client gửi lên là dữ liệu không tin được**: nó đi thẳng vào đường dẫn filesystem. Đã có `_safe_name()` + test chặn `../`.
3. **Lỗi mạng ≠ lỗi nhận diện.** Gộp chung hai loại lỗi làm người dùng tưởng bản nhạc hỏng trong khi nó vẫn đang chạy.
4. **`.gitignore` từng bị nối chuỗi hỏng** thành `/clef_*server/data/`, làm mất tác dụng cả hai quy tắc và suýt commit cả database lẫn ảnh upload. Sau khi sửa .gitignore phải chạy `git check-ignore -v <đường dẫn>` để xác minh.

## Số đo mới nhất

| Hạng mục | Kết quả |
|---|---|
| Transcribe 1 ảnh | 3 phút 57 giây |
| Test backend | 11/11 đạt |
| Kiểu + lint frontend | Sạch |

## Việc còn nợ (đưa sang Chu kỳ 2)

- Tự host soundfont, đang tải từ `gleitz.github.io`.
- Nén ảnh phân tích, đang ~4 MB.
- Dockerfile bake sẵn checkpoint.
- Kiểm thử tay thao tác chọn file (công cụ tự động không thao tác được ô chọn file).

## Liên quan
- Báo cáo đầy đủ: `../reports/20260726_0059-frontend-mvp-va-loi-phat-hien.md`
