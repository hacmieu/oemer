# Đóng dự án Oemer Web

- **Thời gian**: 2026-07-26 01:54
- **Quyết định**: **ĐÓNG** — không tiếp tục Chu kỳ 2/3
- **Người quyết định**: chủ dự án (hacmieu)

## Lý do (theo chủ dự án)

1. **Chất lượng OMR kém hơn Audiveris rõ** — sau khi thử bài thật (*Yêu Xa*), chưa thấy trường hợp dùng oemer mà Audiveris không làm tốt hơn.
2. **Tốn CPU nặng** — ~4 phút/ảnh, ~331% CPU trên một máy; tăng worker không tăng thông lượng.
3. **Chưa tìm ra use case** — MVP kỹ thuật chạy được (upload → xem → nghe), nhưng không có lý do kinh doanh/sản phẩm để duy trì.

## Đã làm được gì trước khi đóng (để sau này tra)

| Hạng mục | Trạng thái |
|---|---|
| Fork `hacmieu/oemer` | Có |
| Vá OpenCV 5 + ghim `<5` | Có |
| Backend FastAPI + ProcessPool + SQLite | Có, test đồng thời đạt |
| Frontend Next.js (xem + nghe) | Có |
| SPIKE OSMD + audio player | Đạt |
| Chu kỳ 2 (quy mô) / Chu kỳ 3 (sửa nhạc) | **Không làm** |

Code và log giữ trên fork; không xoá repo. Không cam kết bảo trì tiếp.

## Hệ quả vận hành

- Kế hoạch PDCA Frontend và các ACT Chu kỳ 2 → **hủy / đóng**.
- Không triển khai production, không Docker bake checkpoint, không nhận PDF, không tự host soundfont.
- Nếu sau này mở lại: đọc lại `memory/README.md` và các báo cáo CHECK trước khi viết code mới.

## Liên quan
- Kế hoạch đóng: `../plans/20260726_0154-dong-du-an-oemer-web.md`
- Ghi nhớ: `../memory/20260726_0154-du-an-da-dong.md`
