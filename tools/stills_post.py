"""Post-processing for tools/stills.mjs (called by it; usable alone).

python -I tools/stills_post.py <outDir> --frames 0,8,33 [--phone] [--luma] [--picture y0:y1] [--cols 5] [--width 384]

- --phone: writes fNNNN_phone.png, 390 px wide (Lanczos), the YouTube portrait player width.
- --luma: prints mean Rec.709 luma (0-255) per still (Y' = 0.2126 R' + 0.7152 G' + 0.0722 B'),
  over the whole frame and, with --picture y0:y1, over rows y0..y1-1 only.
- Always writes sheet.png: a contact sheet labelled with the TRUE frame numbers (from the file names).
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont


def load_font(size):
    for name in ("consola.ttf", "DejaVuSansMono.ttf", "cour.ttf", "arial.ttf"):
        for base in ("C:/Windows/Fonts", "/usr/share/fonts/truetype/dejavu", ""):
            p = os.path.join(base, name) if base else name
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def luma(img, y0=None, y1=None):
    a = np.asarray(img.convert("RGB"), dtype=np.float64)
    if y0 is not None:
        a = a[y0:y1]
    return float((a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722).mean())


def contact_sheet(items, out_path, cols=5, width=384, title=None):
    """items: list of (label, PIL image)."""
    if not items:
        return
    w0, h0 = items[0][1].size
    th = round(width * h0 / w0)
    bar = 30
    gap = 6
    head = 40 if title else 0
    cols = max(1, min(cols, len(items)))
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * width + (cols + 1) * gap, head + rows * (th + bar) + (rows + 1) * gap), (24, 26, 32))
    d = ImageDraw.Draw(sheet)
    font = load_font(20)
    if title:
        d.text((gap + 4, 10), title, fill=(230, 230, 230), font=font)
    for i, (label, im) in enumerate(items):
        r, c = divmod(i, cols)
        x = gap + c * (width + gap)
        y = head + gap + r * (th + bar + gap)
        thumb = im.convert("RGB").resize((width, th), Image.LANCZOS)
        sheet.paste(thumb, (x, y + bar))
        d.rectangle([x, y, x + width - 1, y + bar - 1], fill=(0, 0, 0))
        d.text((x + 6, y + 4), label, fill=(255, 255, 255), font=font)
    sheet.save(out_path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("outdir")
    ap.add_argument("--frames", required=True)
    ap.add_argument("--phone", action="store_true")
    ap.add_argument("--luma", action="store_true")
    ap.add_argument("--picture", default=None)
    ap.add_argument("--cols", type=int, default=5)
    ap.add_argument("--width", type=int, default=384)
    a = ap.parse_args()
    frames = [int(x) for x in a.frames.split(",") if x.strip()]
    y0 = y1 = None
    if a.picture:
        y0, y1 = (int(v) for v in a.picture.split(":"))
    items = []
    for f in frames:
        p = os.path.join(a.outdir, "f%04d.png" % f)
        if not os.path.exists(p):
            print("missing still: %s" % p, file=sys.stderr)
            continue
        im = Image.open(p)
        im.load()
        items.append(("f%04d  (%.2f s)" % (f, f / 30.0), im))
        if a.phone:
            w, h = im.size
            im.convert("RGB").resize((390, round(390 * h / w)), Image.LANCZOS).save(os.path.join(a.outdir, "f%04d_phone.png" % f))
        if a.luma:
            line = "f%04d  luma %6.1f" % (f, luma(im))
            if y0 is not None:
                line += "   picture rows %d-%d: %6.1f" % (y0, y1, luma(im, y0, y1))
            print(line)
    contact_sheet(items, os.path.join(a.outdir, "sheet.png"), cols=a.cols, width=a.width, title=os.path.basename(os.path.normpath(a.outdir)))
    print("sheet: %s (%d stills)%s" % (os.path.join(a.outdir, "sheet.png"), len(items), "; phone copies written" if a.phone else ""))


if __name__ == "__main__":
    main()
