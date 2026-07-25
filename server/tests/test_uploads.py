"""The uploaded filename reaches both the filesystem and the score title."""
import pytest

from server.jobs import _safe_name


@pytest.mark.parametrize(
    "given, expected",
    [
        ("tabi.jpg", "tabi.jpg"),
        ("Bản nhạc số 1.png", "Bản nhạc số 1.png"),  # non-ASCII names stay readable
        ("../../etc/passwd", "passwd"),
        ("/absolute/path.png", "path.png"),
        ("..", "ban-nhac.png"),
        ("", "ban-nhac.png"),
        # A backslash is not a separator on POSIX, so it is neutralised instead.
        ("a/b\\c.png", "b_c.png"),
        ("weird;name|pipe.png", "weird_name_pipe.png"),
    ],
)
def test_safe_name(given, expected):
    assert _safe_name(given) == expected


def test_safe_name_never_escapes_its_directory(tmp_path):
    for hostile in ("../../x.png", "/etc/x.png", "....//x.png"):
        target = (tmp_path / "job" / _safe_name(hostile)).resolve()
        assert target.parent == (tmp_path / "job").resolve()
