# Memory: Fork hacmieu + Ràng buộc kiến trúc cho Frontend

- **Ghi ngày**: 2026-07-25 23:27

## Trạng thái Git (đã thay đổi — ghi đè memory cũ)
- ✅ Đã fork: **https://github.com/hacmieu/oemer**
- `origin` = `git@github.com:hacmieu/oemer.git` ← **push an toàn vào đây**
- `upstream` = `https://github.com/BreezeWhite/oemer.git` (repo gốc, chỉ để fetch)
- Đồng bộ upstream: `git fetch upstream && git merge upstream/main`
- ⚠️ Ghi chú cũ "không được push" (file `20260725_2319`) **nay đã hết hiệu lực**.

## RÀNG BUỘC KIẾN TRÚC PHẢI NHỚ ⚠️

### 1. `oemer/layers.py` dùng global state → không chạy song song được
```python
_layers = {}   # module-level global
```
- 2 job trong cùng tiến trình sẽ **ghi đè dữ liệu của nhau**.
- `register_layer()` trùng tên chỉ `print` rồi return im lặng → lỗi âm thầm.
- **Quy tắc**: mỗi worker = 1 tiến trình = **1 job tại một thời điểm**. Scale bằng process, KHÔNG bằng thread.

### 2. Xử lý mất 3–5 phút/ảnh (có GPU)
⇒ Bắt buộc hàng đợi + job bất đồng bộ. Không bao giờ xử lý trong 1 HTTP request đồng bộ.

### 3. `ete.extract(args: Namespace)` gắn argparse + ghi thẳng ra đĩa
⇒ Cần viết wrapper nhận tham số thường (`oemer/api/core.py`).

### 4. Checkpoint tải lúc runtime (tới 10 phút lần đầu)
⇒ Bake sẵn vào Docker image.

## Quyết định công nghệ đã chốt
| Việc | Chọn |
|---|---|
| Render bản nhạc | **OSMD** (native MusicXML, license BSD) |
| Phát nhạc | **`@isamu/osmd-audio-player`** ⚠️ phải SPIKE kiểm tra tương thích trước |
| Frontend | Next.js + TypeScript + Tailwind + shadcn/ui |
| Backend | FastAPI + Redis/RQ + Postgres + S3/R2 |
| Sửa nhạc (tương lai) | RiffScore ⚠️ **MusicXML import chưa phát hành** → hoãn sang Chu kỳ 3 |

## Cạm bẫy đã biết (đừng lặp lại)
- OSMD **không phải editor** — đừng kỳ vọng sửa nốt bằng OSMD.
- OSMD audio player **chính thức = sponsor trả phí**, chỉ dùng bản cộng đồng.
- `jimutt/osmd-audio-player` (bản gốc) **đã ngừng phát triển**, ghim OSMD ^0.8.4.
- MusicXML do oemer sinh có thể chưa chuẩn → cần validate trước khi đổ vào OSMD.

## Liên quan
- Kế hoạch PDCA: `plans/20260725_2327-pdca-frontend-oemer-web.md`
- Báo cáo khảo sát: `reports/20260725_2327-fork-va-khao-sat-cong-nghe-frontend.md`
