# Reports — Single Source of Truth

Thư mục chứa các báo cáo phân tích/điều tra. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Danh sách báo cáo

| Ngày giờ | Báo cáo | Tóm tắt |
|---|---|---|
| 2026-07-25 23:27 | [Fork + Khảo sát công nghệ Frontend](20260725_2327-fork-va-khao-sat-cong-nghe-frontend.md) | Đã fork sang `hacmieu/oemer` và push. Phát hiện `layers.py` dùng global state ⇒ không chạy song song. Chốt OSMD để render, `@isamu/osmd-audio-player` để phát nhạc; RiffScore chưa import được MusicXML. |
| 2026-07-25 23:19 | [Phân tích Frontend](20260725_2319-phan-tich-frontend.md) | Kết luận: `oemer` **chưa có FE**, hiện chỉ là CLI Python thuần; `docs/index.html` chỉ là trang demo tĩnh. |

## Kết luận nổi bật

1. **`oemer` chưa có frontend** — chỉ CLI + notebook Colab.
2. **Ràng buộc chặn lớn nhất cho app đa người dùng**: `oemer/layers.py` dùng dict toàn cục cấp module ⇒ mỗi tiến trình chỉ chạy được 1 job; phải scale bằng process.
3. **Nghe nhạc trên web là khả thi** qua OSMD + audio player cộng đồng, nhưng cần SPIKE kiểm chứng tương thích trước (bản chính thức của OSMD thu phí sponsor).
4. **Sửa MusicXML online chưa sẵn sàng** — RiffScore chưa hỗ trợ import MusicXML ⇒ đẩy sang giai đoạn sau.
