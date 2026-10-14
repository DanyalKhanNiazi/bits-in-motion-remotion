"""Contact sheet from a video, labelled with TRUE frame numbers.

python -I tools/sheet.py <video> <outPng> [--every 30] [--ranges a-b:step,...] [--width 384] [--cols 6]

  --every N        frames 0, N, 2N, ... and the last frame (default 30 = 1 per second at 30 fps)
  --ranges ...     explicit ranges instead, e.g. 0-60:5,460-510:5,1780-1889:5 (inclusive)
  --width W        thumbnail width (default 384)

Frames are selected by decoded frame INDEX (ffmpeg select by n), never by an fps filter, so labels are exact.
Each selected frame's index is cross-checked against its timestamp (pts_time x fps).
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stills_post import contact_sheet  # noqa: E402


def probe(video):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
         "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "json", video],
        capture_output=True, text=True, check=True)
    s = json.loads(r.stdout)["streams"][0]
    num, den = (int(x) for x in s["r_frame_rate"].split("/"))
    return int(s["width"]), int(s["height"]), num / den, int(s["nb_read_frames"])


def parse_ranges(spec, last):
    out = set()
    for tok in spec.split(","):
        tok = tok.strip()
        if not tok:
            continue
        m = re.match(r"^(\d+)(?:-(\d+))?(?::(\d+))?$", tok)
        if not m:
            raise SystemExit("bad range: %s" % tok)
        a = int(m.group(1))
        b = int(m.group(2)) if m.group(2) else a
        step = int(m.group(3)) if m.group(3) else 1
        for f in range(a, min(b, last) + 1, step):
            out.add(f)
    return sorted(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--every", type=int, default=30)
    ap.add_argument("--ranges", default=None)
    ap.add_argument("--width", type=int, default=384)
    ap.add_argument("--cols", type=int, default=6)
    a = ap.parse_args()

    W, H, fps, count = probe(a.video)
    last = count - 1
    if a.ranges:
        frames = parse_ranges(a.ranges, last)
    else:
        frames = list(range(0, count, a.every))
        if frames[-1] != last:
            frames.append(last)
    if not frames:
        raise SystemExit("no frames selected")
    tw = a.width
    th = round(tw * H / W)
    tw -= tw % 2
    th -= th % 2
    expr = "+".join("eq(n\\,%d)" % f for f in frames)
    cmd = ["ffmpeg", "-v", "info", "-nostats", "-i", a.video,
           "-vf", "select='%s',showinfo,scale=%d:%d:flags=lanczos" % (expr, tw, th),
           "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr.decode("utf8", "replace")[-2000:])
        raise SystemExit("ffmpeg failed")
    raw = r.stdout
    size = tw * th * 3
    n = len(raw) // size
    pts = [float(x) for x in re.findall(r"pts_time:\s*([0-9.]+)", r.stderr.decode("utf8", "replace"))]
    if n != len(frames):
        print("warning: expected %d frames, got %d" % (len(frames), n), file=sys.stderr)
    items = []
    mism = 0
    for i in range(min(n, len(frames))):
        f = frames[i]
        if i < len(pts) and abs(round(pts[i] * fps) - f) > 0:
            mism += 1
        img = Image.fromarray(np.frombuffer(raw[i * size:(i + 1) * size], dtype=np.uint8).reshape(th, tw, 3))
        items.append(("f%04d  (%.2f s)" % (f, f / fps), img))
    title = "%s  |  %dx%d  %.3g fps  %d frames  |  %d shown" % (os.path.basename(a.video), W, H, fps, count, len(items))
    contact_sheet(items, a.out, cols=a.cols, width=tw, title=title)
    print("sheet: %s (%d frames; %s)" % (a.out, len(items), "labels verified against pts" if mism == 0 else "%d label/pts mismatches!" % mism))


if __name__ == "__main__":
    main()
