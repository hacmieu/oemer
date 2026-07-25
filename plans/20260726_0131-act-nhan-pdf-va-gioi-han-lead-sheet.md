# ACT — nhận PDF + nói rõ giới hạn lead sheet

- **Thời gian**: 2026-07-26 01:31
- **Nguồn kích hoạt**: thử bài [Yêu Xa từ Google Drive](../reports/20260726_0131-thu-yeuxa-tu-google-drive.md)
- **Trạng thái**: đề xuất cho Chu kỳ 2, chưa làm

## Việc cần làm

1. **Nhận PDF phía server** (rasterize bằng `pdftoppm` / PyMuPDF, lấy trang 1 hoặc ghép nhiều trang), hoặc từ chối với thông báo rõ: *"Hãy xuất ảnh PNG/JPG, API chưa nhận PDF."*
2. **Trên UI kết quả**, với bản 1 khuông: nhắc ngắn *"Nhận diện chỉ lấy nốt. Lời và hợp âm trên ảnh không được đưa vào file."* — tránh kỳ vọng nghe như bản thu có lời.
3. Giữ nguyên không hứa OCR lời/hợp âm trong Chu kỳ 2 trừ khi có SPIKE riêng.

## Không làm ngay

- OCR lời / hợp âm (ngoài phạm vi oemer hiện tại).
- Sửa nhạc online (vẫn Chu kỳ 3).
