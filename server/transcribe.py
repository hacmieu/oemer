"""Thin wrapper around the oemer CLI pipeline.

MUST run in a dedicated process. ``oemer.layers`` keeps its registry in a
module-level global and ``ete.clear_data()`` wipes it for the whole process, so
two concurrent transcriptions in one process silently return each other's data.
See reports/20260725_2338-check-thuc-nghiem-race-condition.md
"""
from argparse import Namespace
from dataclasses import dataclass
from pathlib import Path

from oemer import MODULE_PATH


@dataclass
class Result:
    musicxml: Path
    preview: Path | None


def checkpoints_ready() -> bool:
    return (Path(MODULE_PATH) / "checkpoints/unet_big/model.onnx").exists()


def transcribe(img_path: Path, out_dir: Path, without_deskew: bool = False) -> Result:
    if not checkpoints_ready():
        raise RuntimeError(
            "Missing model checkpoints. Download 1st_model.onnx and 2nd_model.onnx from "
            "https://github.com/BreezeWhite/oemer/releases/tag/checkpoints into "
            f"{MODULE_PATH}/checkpoints/{{unet_big,seg_net}}/model.onnx"
        )

    # Imported here so the parent process never loads the heavy pipeline.
    from oemer import ete
    from oemer.draw_teaser import teaser

    out_dir.mkdir(parents=True, exist_ok=True)
    ete.clear_data()

    musicxml = Path(ete.extract(Namespace(
        img_path=str(img_path),
        output_path=str(out_dir),
        use_tf=False,
        # Writes a ~150 MB pickle next to the input, far too large to keep per job.
        save_cache=False,
        without_deskew=without_deskew,
    )))

    # The annotated image is a nice-to-have; a failure here must not lose the score.
    preview = out_dir / f"{musicxml.stem}_preview.png"
    try:
        teaser().save(preview)
    except Exception:
        preview = None

    return Result(musicxml=musicxml, preview=preview)
