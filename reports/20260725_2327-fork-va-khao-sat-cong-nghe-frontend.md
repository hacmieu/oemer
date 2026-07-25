# Báo cáo: Fork repo + Khảo sát công nghệ Frontend

- **Thời gian**: 2026-07-25 23:27
- **Yêu cầu**: Fork repo về GitHub `hacmieu`, push lên, khảo sát công nghệ để lập kế hoạch PDCA cho frontend.

## 1. Kết quả Fork & Push

| Hạng mục | Kết quả |
|---|---|
| Fork | ✅ Tạo tại https://github.com/hacmieu/oemer |
| `origin` | Đổi thành `git@github.com:hacmieu/oemer.git` (fork của bạn) |
| `upstream` | Giữ `https://github.com/BreezeWhite/oemer.git` (repo gốc) |
| Push `main` | ✅ Thành công, branch `main` đã track `origin/main` |

Từ giờ `git push` sẽ đẩy lên fork của bạn, an toàn. Muốn lấy cập nhật từ repo gốc: `git fetch upstream && git merge upstream/main`.

## 2. Phát hiện kỹ thuật quan trọng (đọc source)

### 2.1. Pipeline KHÔNG chạy song song được — ràng buộc lớn nhất ⚠️
`oemer/layers.py` dùng dict **toàn cục cấp module** (`_layers = {}`), được `ete.py` ghi/đọc xuyên suốt pipeline. Hai job chạy đồng thời trong cùng tiến trình sẽ **ghi đè dữ liệu của nhau**.

Tệ hơn: `register_layer()` khi trùng tên chỉ `print` cảnh báo rồi **return im lặng**, không raise → lỗi sẽ rất khó phát hiện.

**Hệ quả cho mục tiêu "nhiều người dùng"**: bắt buộc cô lập theo **tiến trình**, mỗi worker xử lý 1 job tại một thời điểm. Scale bằng số tiến trình, không dùng thread.

### 2.2. Các ràng buộc khác
- **Thời gian xử lý 3–5 phút/ảnh** (có GPU) ⇒ bắt buộc hàng đợi + job bất đồng bộ, không thể xử lý trong 1 HTTP request.
- **`ete.extract(args: Namespace)`** gắn với argparse và đọc/ghi thẳng ra đĩa ⇒ cần lớp bọc.
- **Checkpoint tải runtime** (~4 file, tới 10 phút lần đầu) ⇒ phải bake sẵn vào Docker image.

## 3. Khảo sát thư viện web

### 3.1. Hiển thị bản nhạc → chọn **OpenSheetMusicDisplay (OSMD)**
- Native MusicXML (đúng định dạng oemer xuất ra), dựa trên VexFlow, license **BSD** (dùng thương mại được).
- So sánh: **Verovio** mạnh nhưng thiên về MEI (phải convert); **VexFlow** không đọc MusicXML; **vexml** còn thử nghiệm.
- ⚠️ OSMD tự nhận: *"là renderer, không phải editor"* — chỉ sửa được hạn chế (màu sắc, ẩn/hiện).

### 3.2. Phát nhạc → chọn **`@isamu/osmd-audio-player`**
- Framework-agnostic, 91 nhạc cụ MIDI (soundfont Musyngkite), tự nhận tempo, seek, điều chỉnh BPM.
- ⚠️ **Cảnh báo**: bản gốc `jimutt/osmd-audio-player` **đã ngừng phát triển** và ghim `opensheetmusicdisplay@^0.8.4`. Fork `@isamu/*` mới hơn nhưng **vẫn phải kiểm chứng tương thích** với OSMD hiện tại.
- ⚠️ Audio player **chính thức** của OSMD (`PlaybackManager`) chỉ mở cho **sponsor trả phí** → không dùng ở MVP.
- **Dự phòng**: server-side MusicXML → MIDI → MP3.

### 3.3. Sửa MusicXML online (tương lai) → **RiffScore**, nhưng chưa dùng được ngay
- RiffScore: React, self-host, embed được, export MusicXML/JSON/ABC, playback bằng Tone.js.
- ⚠️ **MusicXML _import_ vẫn nằm ở mục "Coming Soon"** và dự án còn rất non trẻ (~6 sao GitHub). Không import được MusicXML thì **không dùng được cho use case này** — vì ta cần nạp file do oemer sinh ra.
- Thay thế: **Verovio Editor** (thiên MEI), **Flat.io Embed** (thương mại, mất phí, phụ thuộc bên thứ ba).
- ⇒ Kết luận: sửa nhạc online **đúng là việc của tương lai**, xếp vào Chu kỳ PDCA 3.

## 4. Đề xuất kiến trúc

```
[Next.js + Tailwind + shadcn/ui]  ← UI chuyên nghiệp, responsive
            │ REST
[FastAPI]  ── enqueue ──> [Redis + RQ] ──> [Worker (1 job/tiến trình)]
            │                                        │ gọi oemer pipeline
        [S3/R2 + Postgres]  <─────────────────────────┘
```
Hiển thị + phát nhạc chạy hoàn toàn phía trình duyệt bằng OSMD + audio player.

## 5. Khuyến nghị hành động
Bắt đầu bằng **SPIKE rủi ro cao nhất** (nửa ngày): dựng 1 trang HTML tĩnh với OSMD + audio player, nạp file `.musicxml` **do chính oemer sinh ra**. Nếu bước này không thông, phải đổi hướng sang phương án MIDI→MP3 phía server trước khi đầu tư xây cả hệ thống.

## Liên quan
- Kế hoạch chi tiết: `plans/20260725_2327-pdca-frontend-oemer-web.md`
- Bối cảnh ban đầu: `reports/20260725_2319-phan-tich-frontend.md`
