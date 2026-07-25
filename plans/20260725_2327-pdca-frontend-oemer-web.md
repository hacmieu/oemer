# Kế hoạch PDCA: Xây dựng Frontend "Oemer Web"

- **Ghi ngày**: 2026-07-25 23:27
- **Trạng thái**: PLAN (Chu kỳ 1 chưa khởi động — chờ duyệt)
- **Repo**: `hacmieu/oemer` (fork), upstream `BreezeWhite/oemer`
- **Bối cảnh**: `oemer` hiện chỉ là CLI (xem `reports/20260725_2319-phan-tich-frontend.md`)

## Mục tiêu sản phẩm (theo yêu cầu)

1. Giao diện **chuyên nghiệp** (không phải demo tạm bợ).
2. **Nhiều người dùng** đồng thời.
3. **Nghe được** bản nhạc vừa transcribe.
4. **Tương lai: sửa được** MusicXML ngay trên web.

---

# RÀNG BUỘC KỸ THUẬT ĐÃ XÁC MINH (đọc trước khi làm)

Đây là các phát hiện từ việc đọc source, quyết định toàn bộ kiến trúc:

### 1. Pipeline KHÔNG an toàn khi chạy song song ⚠️ (ràng buộc lớn nhất)
`oemer/layers.py` dùng **dict toàn cục cấp module**:

```python
_layers = {}          # global, chia sẻ toàn tiến trình
_access_count = {}
```

`ete.py` gọi `clear_data()` rồi `register_layer(...)` liên tục. Hệ quả:
- **Không thể** chạy 2 bản transcribe đồng thời trong cùng một tiến trình → dữ liệu sẽ ghi đè lẫn nhau.
- `register_layer` còn im lặng bỏ qua nếu tên đã tồn tại (chỉ `print`, không raise) → lỗi âm thầm, rất khó debug.
- ⇒ **Bắt buộc cô lập theo tiến trình (process)**: mỗi worker chỉ xử lý **1 job tại một thời điểm**. Scale bằng cách tăng số tiến trình worker, KHÔNG bằng thread.

### 2. Thời gian xử lý dài
3–5 phút/ảnh khi có GPU (theo README), CPU còn lâu hơn ⇒ **không thể** xử lý trong 1 HTTP request đồng bộ. Bắt buộc dùng **hàng đợi + job bất đồng bộ**.

### 3. Logic hiện tại gắn chặt với file & argparse
`ete.extract(args: Namespace)` nhận `Namespace`, đọc/ghi thẳng ra đĩa; `ete.main()` tự parse `sys.argv`. Cần một lớp bọc (wrapper) nhận tham số thường thay vì `Namespace`.

### 4. Checkpoint tải lúc runtime
`CHECKPOINTS_URL` tải ~4 file từ GitHub Releases ở lần chạy đầu (tới 10 phút). ⇒ Phải **bake sẵn vào Docker image**, không tải lúc user đang chờ.

---

# LỰA CHỌN CÔNG NGHỆ (đã khảo sát)

| Nhu cầu | Chọn | Lý do / Cảnh báo |
|---|---|---|
| Hiển thị bản nhạc | **OpenSheetMusicDisplay (OSMD)** | Native MusicXML, license BSD (dùng thương mại được), chuẩn de-facto. |
| Phát nhạc | **`@isamu/osmd-audio-player`** | Fork còn cập nhật, 91 nhạc cụ MIDI, tự nhận tempo, seek. ⚠️ Bản gốc `jimutt/osmd-audio-player` **đã ngừng phát triển** và ghim `opensheetmusicdisplay@^0.8.4` → **phải kiểm tra tương thích** với OSMD mới. |
| Phát nhạc (chính thức) | OSMD `PlaybackManager` | ⚠️ Chỉ dành cho **sponsor** (trả phí) → không dùng ở MVP. |
| Phát nhạc (dự phòng) | Server: MusicXML → MIDI → MP3 | Dùng nếu playback trình duyệt không đạt. Ổn định hơn nhưng mất tính tương tác. |
| Sửa nhạc (tương lai) | **RiffScore** | React, self-host, embed được, export MusicXML. ⚠️ **MusicXML _import_ vẫn "Coming Soon"** và dự án còn rất non trẻ → **chưa dùng được ngay**, đó là lý do sửa nhạc để ở Chu kỳ 3. |
| Sửa nhạc (thay thế) | Verovio Editor / Flat.io Embed | Verovio thiên MEI; Flat.io **là dịch vụ thương mại** (mất phí, phụ thuộc bên thứ 3). |

**Stack đề xuất**
- Frontend: **Next.js (React) + TypeScript + Tailwind CSS + shadcn/ui**
- Backend: **FastAPI** (Python, chung ngôn ngữ với `oemer`)
- Hàng đợi: **Redis + RQ** (đơn giản hơn Celery, đủ dùng)
- Lưu trữ: local volume ở MVP → S3/Cloudflare R2 khi lên production
- Đóng gói: **Docker Compose** (api / worker / redis / web)

---

# CHU KỲ PDCA 1 — MVP: Upload → Transcribe → Xem → Nghe

## PLAN
**Giả thuyết**: Người dùng upload ảnh bản nhạc, chờ có tiến độ rõ ràng, rồi xem bản nhạc đã số hoá và bấm play nghe được.

**Tiêu chí thành công (đo được)**
- [ ] Upload 1 ảnh → nhận `job_id` trong < 1 giây.
- [ ] Trang kết quả hiển thị bản nhạc bằng OSMD, không lỗi console.
- [ ] Bấm Play phát ra tiếng, có con trỏ chạy theo nốt.
- [ ] Tải được file `.musicxml`.
- [ ] **2 người upload cùng lúc → 2 kết quả đúng, không lẫn dữ liệu** (kiểm chứng ràng buộc #1).

## DO
| # | Việc | Verify |
|---|---|---|
| 1 | Viết `oemer/api/core.py`: hàm `transcribe(img_path, out_dir, without_deskew) -> paths`, bọc `ete.extract` (không qua argparse), gọi `clear_data()` trước và sau. | Chạy được bằng Python thuần, ra `.musicxml` giống hệt CLI. |
| 2 | FastAPI: `POST /api/jobs` (upload) → enqueue; `GET /api/jobs/{id}` (trạng thái); `GET /api/jobs/{id}/musicxml`. | `curl` chạy đủ 3 endpoint. |
| 3 | RQ worker, **`--burst`/concurrency = 1 mỗi tiến trình**; timeout job 15 phút. | Chạy 2 worker → 2 job song song vẫn đúng. |
| 4 | Dockerfile bake sẵn checkpoints; `docker-compose.yml` 4 service. | `docker compose up` xong là dùng ngay, không tải checkpoint. |
| 5 | Next.js: trang Upload (kéo-thả, xem trước ảnh). | Upload được, hiện lỗi rõ khi sai định dạng. |
| 6 | Trang Job: polling trạng thái + thanh tiến độ theo bước (`Đang phân tích khuông nhạc…`). | Trạng thái đổi đúng, không "đơ" khi chờ 5 phút. |
| 7 | Trang Kết quả: OSMD render + `@isamu/osmd-audio-player` (play/pause/seek/BPM) + nút tải. | Nghe được, seek được. |

**Cột mốc rủi ro cao — làm SPIKE trước tiên (nửa ngày)**: dựng 1 trang HTML tĩnh chỉ có OSMD + audio player, nạp 1 file `.musicxml` **do chính `oemer` sinh ra**. Nếu bước này thất bại, toàn bộ Chu kỳ 1 phải đổi hướng sang phương án server-side MIDI→MP3.

## CHECK
- Chạy pipeline trên ≥ 5 ảnh mẫu trong `figures/`, đối chiếu kết quả web vs CLI.
- Test tải: 5 job đồng thời → kiểm tra không lẫn dữ liệu (rủi ro #1).
- Đo: thời gian job, tỉ lệ lỗi, thời gian render OSMD.
- Kiểm tra output OSMD có cảnh báo parse MusicXML nào không (oemer có thể sinh XML chưa chuẩn).

## ACT
- Nếu playback trình duyệt lỗi/không tương thích OSMD mới → chuyển sang **dự phòng MIDI→MP3 phía server**.
- Nếu OSMD báo lỗi parse → bổ sung bước **validate/normalize MusicXML** sau `build_system.py`.
- Ghi lại kết quả vào `reports/` và cập nhật kế hoạch chu kỳ 2.

---

# CHU KỲ PDCA 2 — Chịu tải nhiều người dùng & giao diện chuyên nghiệp

## PLAN
**Mục tiêu**: từ "chạy được" thành "nhiều người dùng thật sự dùng được".

**Tiêu chí thành công**
- [ ] 20 người upload đồng thời không sập, có vị trí hàng đợi hiển thị cho người dùng.
- [ ] Có tài khoản + lịch sử bản nhạc cá nhân.
- [ ] Lighthouse: Accessibility ≥ 90, Performance ≥ 85.
- [ ] Responsive: dùng tốt trên điện thoại (vì người dùng chụp ảnh bản nhạc bằng điện thoại).

## DO
- Xác thực (Auth.js/Clerk) + DB (Postgres): user, job, score.
- Lưu file lên S3/R2; job tự dọn dẹp theo TTL.
- Rate limit + giới hạn dung lượng ảnh + quét định dạng.
- Hàng đợi: hiển thị vị trí chờ, huỷ job, tự thử lại khi lỗi.
- Auto-scale worker theo độ dài hàng đợi.
- **Thiết kế UI nghiêm túc**: design system (typography, spacing, dark mode), empty/loading/error state, onboarding, trang thư viện bản nhạc.
- Observability: Sentry + log có cấu trúc + metrics.

## CHECK
- Load test (k6/Locust) 20–50 người dùng đồng thời.
- Kiểm thử trên thiết bị thật (iOS/Android).
- Kiểm thử a11y bằng bàn phím + screen reader.

## ACT
- Điều chỉnh số worker / kích thước máy theo số liệu thật.
- Nếu chi phí GPU quá cao → cân nhắc hàng đợi CPU giá rẻ + báo thời gian chờ dài hơn.

---

# CHU KỲ PDCA 3 — Sửa bản nhạc online

## PLAN
**Tiêu chí thành công**
- [ ] Sửa được cao độ / trường độ / xoá-thêm nốt.
- [ ] Lưu bản sửa thành phiên bản mới, không mất bản gốc.
- [ ] Nghe lại đúng bản đã sửa.

## DO (theo thứ tự thử)
1. **Đánh giá lại RiffScore** — điều kiện tiên quyết: **MusicXML import đã phát hành**. Nếu chưa → hoãn.
2. Nếu không: tự xây lớp sửa nhẹ trên OSMD (OSMD **không phải editor**, chỉ sửa hạn chế: màu, ẩn/hiện) + thao tác trực tiếp trên cây MusicXML, dùng OSMD để render lại.
3. Phương án cuối: nhúng dịch vụ thương mại (Flat.io Embed) — chấp nhận phụ thuộc & chi phí.

**Bổ trợ**: vì OMR luôn có sai sót, ưu tiên **sửa nhanh lỗi thường gặp** (sai cao độ, sai dấu hoá, sai trường độ) hơn là làm editor đầy đủ.

## CHECK
- Người dùng thật sửa 1 bản nhạc có lỗi OMR trong < 5 phút.
- Xuất MusicXML mở đúng bằng MuseScore.

## ACT
- Quyết định giữ self-host hay chuyển sang dịch vụ dựa trên chi phí & trải nghiệm.

---

# RỦI RO CHÍNH

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Global state `_layers` gây lẫn dữ liệu giữa người dùng | **Cao** | Cô lập tiến trình, 1 job/worker; test đồng thời ngay từ MVP |
| `osmd-audio-player` không tương thích OSMD mới | **Cao** | SPIKE ngay đầu Chu kỳ 1; dự phòng MIDI→MP3 |
| MusicXML do oemer sinh chưa chuẩn → OSMD lỗi | Trung bình | Validate/normalize; test nhiều ảnh mẫu |
| Chi phí GPU khi nhiều người dùng | Trung bình | Hàng đợi, giới hạn quota, cân nhắc CPU |
| RiffScore chưa import được MusicXML | Trung bình | Để ở Chu kỳ 3, có phương án thay thế |
| Chất lượng OMR kém với ảnh chụp xấu | Trung bình | Hướng dẫn chụp ảnh; cho phép sửa (Chu kỳ 3) |

# KHÔNG LÀM (giữ phạm vi gọn)
- Không train lại model.
- Không sửa thuật toán OMR lõi.
- Không làm app di động native ở giai đoạn này.
- Không refactor `layers.py` thành thread-safe (cô lập tiến trình rẻ và an toàn hơn).

# BƯỚC TIẾP THEO
Chờ duyệt để bắt đầu **SPIKE của Chu kỳ 1**: kiểm chứng OSMD + audio player đọc được file `.musicxml` do `oemer` sinh ra. Đây là điểm rủi ro cao nhất và rẻ nhất để kiểm chứng trước.
