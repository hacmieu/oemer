# Reports — Single Source of Truth

Thư mục chứa các báo cáo phân tích/điều tra. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Danh sách báo cáo

| Ngày giờ | Báo cáo | Tóm tắt |
|---|---|---|
| 2026-07-26 01:31 | [**Thử thực tế — *Yêu Xa* (PDF Google Drive)**](20260726_0131-thu-yeuxa-tu-google-drive.md) | **MỚI NHẤT.** Lead sheet có lời + hợp âm + watermark. Nhận diện 4′29″, nghe được, 3 ô đầu khớp cao độ. Không extract lời/hợp âm. API chưa nhận PDF. |
| 2026-07-26 00:59 | [✅ Frontend MVP + 7 lỗi phát hiện khi chạy thật](20260726_0059-frontend-mvp-va-loi-phat-hien.md) | Luồng đầy đủ đã chạy: upload → chờ → xem → nghe → tải về. 7 lỗi chỉ lộ ra khi nhìn màn hình thật, trong đó 3 lỗi **im lặng hoàn toàn** (tiêu đề thành mã job, con trỏ đứng yên, lỗi mạng báo nhầm). |
| 2026-07-26 00:24 | [✅ Backend MVP + Test đồng thời](20260726_0024-backend-mvp-va-test-dong-thoi.md) | Đã dựng FastAPI + ProcessPoolExecutor + SQLite. **Chứng minh hết lỗi tranh chấp**: 2 ảnh khác nhau upload đồng thời → 28 vs 14 ô nhịp, đúng kết quả từng ảnh. Phát hiện: **tăng worker không tăng thông lượng** trên 1 máy. |
| 2026-07-25 23:58 | [**✅ Kết quả SPIKE — OSMD + phát nhạc**](20260725_2358-ket-qua-spike-osmd-playback.md) | **ĐẠT.** Render bản nhạc thật của oemer trong **183 ms**, audio player nạp OK, tự nhận đúng nhạc cụ Piano. Rủi ro số 1 đã gỡ. Cấu hình đã kiểm chứng: OSMD `1.9.7` + `@isamu/osmd-audio-player@1.0.0`. |
| 2026-07-25 23:58 | [Lỗi chặn — OpenCV 5.x](20260725_2358-loi-moi-truong-opencv5.md) | Pipeline **sập hoàn toàn** với OpenCV 5: `HoughLinesP` đổi kiểu trả về `(N,1,4)` → `(N,4)`. `setup.py` không chặn trần nên pip cài nhầm bản 5. Phải ghim `<5`. |
| 2026-07-25 23:38 | [CHECK — Thực nghiệm race condition](20260725_2338-check-thuc-nghiem-race-condition.md) | **Đã chứng minh bằng code chạy thật**: 2 job cùng tiến trình → job A đọc ra dữ liệu của job B, không hề báo lỗi. Thủ phạm là `clear_data()`, không phải `register_layer` đè dữ liệu. |
| 2026-07-25 23:27 | [Fork + Khảo sát công nghệ Frontend](20260725_2327-fork-va-khao-sat-cong-nghe-frontend.md) | Đã fork sang `hacmieu/oemer` và push. Phát hiện `layers.py` dùng global state ⇒ không chạy song song. Chốt OSMD để render, `@isamu/osmd-audio-player` để phát nhạc; RiffScore chưa import được MusicXML. |
| 2026-07-25 23:19 | [Phân tích Frontend](20260725_2319-phan-tich-frontend.md) | Kết luận: `oemer` **chưa có FE**, hiện chỉ là CLI Python thuần; `docs/index.html` chỉ là trang demo tĩnh. |

## Kết luận nổi bật

1. ~~**`oemer` chưa có frontend**~~ — **đã có rồi**: `web/` (Next.js) + `server/` (FastAPI), hoàn thành 2026-07-26.
2. **Ràng buộc chặn lớn nhất cho app đa người dùng (đã chứng minh thực nghiệm)**: `ete.clear_data()` xoá sạch dict toàn cục `_layers` mỗi lần chạy, nên 2 job trong cùng tiến trình sẽ **trả kết quả của nhau mà không báo lỗi**. Bắt buộc mỗi job chạy 1 tiến trình riêng.
3. **Nghe nhạc trên web là khả thi** qua OSMD + audio player cộng đồng, nhưng cần SPIKE kiểm chứng tương thích trước (bản chính thức của OSMD thu phí sponsor).
4. **Sửa MusicXML online chưa sẵn sàng** — RiffScore chưa hỗ trợ import MusicXML ⇒ đẩy sang giai đoạn sau.
5. **Downloader checkpoint của oemer rất chậm** (`chunk_size=512B`): 5 phút mới được 19% của 1 file, trong khi `curl` tải xong 109MB trong 20 giây ⇒ Docker phải bake sẵn checkpoint.
6. **✅ Nghe nhạc trên web đã CHỨNG MINH được** (SPIKE 23:58): OSMD render bản nhạc thật của oemer trong 183 ms, audio player chạy. Bài học: **phải test bằng bundler thật** — test bằng CDN cho kết quả sai lệch (báo lỗi giả).
7. **Số đo thực tế**: transcribe 1 ảnh mất **4 phút 07 giây** trên CPU Apple Silicon ⇒ khẳng định bắt buộc phải có hàng đợi bất đồng bộ.
8. **✅ Lỗi tranh chấp đã xử lý xong** (báo cáo 00:24): cô lập bằng tiến trình, có test tự động bảo vệ và đã kiểm chứng end-to-end qua API thật.
9. **⚠️ Tăng worker KHÔNG tăng thông lượng**: 2 job song song mất 8 phút 41 giây, gần bằng chạy tuần tự. Pipeline vốn đã dùng ~331% CPU ⇒ muốn phục vụ nhiều người **phải thêm máy**, không thể chỉ tăng worker.
10. **✅ Chu kỳ 1 đã xong** (báo cáo 00:59): người dùng tải ảnh lên và **nghe được** bản nhạc ngay trên trình duyệt.
11. **⚠️ Lỗi giao diện nguy hiểm nhất là loại im lặng.** 3 trong 7 lỗi của chu kỳ này không ném exception, không vào log, và lọt qua cả kiểm tra kiểu lẫn lint. Chỉ nhìn màn hình thật với dữ liệu thật mới thấy.
12. **⚠️ Tailwind và OSMD tranh chấp âm thầm**: preflight đặt `height: auto` cho mọi ảnh, làm con trỏ phát nhạc của OSMD co còn 1 pixel. Chi tiết cạm bẫy OSMD: `../memory/20260726_0059-frontend-mvp-xong.md`.
13. **Thử bài thật *Yêu Xa*** (01:31): lead sheet PDF từ Drive chạy được sau khi chuyển PNG; giai điệu mở đầu khớp; **không** có lời/hợp âm; API **chưa nhận PDF**.
