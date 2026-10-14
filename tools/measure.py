"""Per-frame measurements of a render (frames only; nobody watches or listens).

Usage: python -I tools/measure.py <video> [--w 480] [--h 270] [--thr 12] [--out stats.npz] [--ranges a-b,c-d]

Prints: frame count, mean-luma min/mean/max (Rec.709 on decoded sRGB), frames under 28, the near-static share at
three thresholds (< 0.05% / < 0.2% / < 0.5% of pixels changing by more than `--thr` levels, default 12, between
consecutive frames, at 480 x 270) with the longest run of each, and the median changed area. The round-4 judges' figure
("44% of frames change under 0.5% of their pixels") is `--thr 4`. `--ranges` also reports those shares inside
the given frame ranges (e.g. the holds). Moved here from out/style6/r3/tools/ in round 4 (style guide section 14.3).
"""
import subprocess, sys
import numpy as np

args = sys.argv[1:]
if not args:
    print(__doc__)
    sys.exit(1)
video = args[0]
W = int(args[args.index('--w') + 1]) if '--w' in args else 480
H = int(args[args.index('--h') + 1]) if '--h' in args else 270
THR = float(args[args.index('--thr') + 1]) if '--thr' in args else 12
out = args[args.index('--out') + 1] if '--out' in args else None
ranges = []
if '--ranges' in args:
    for tok in args[args.index('--ranges') + 1].split(','):
        a, b = tok.split('-')
        ranges.append((int(a), int(b)))
cmd = ['ffmpeg', '-loglevel', 'error', '-i', video, '-vf', f'scale={W}:{H}:flags=area,format=rgb24', '-f', 'rawvideo', '-']
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
fs = W * H * 3
lum, ch, prev = [], [], None
while True:
    b = p.stdout.read(fs)
    if len(b) < fs:
        break
    a = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    lum.append(float(y.mean()))
    ch.append(1.0 if prev is None else float((np.abs(y - prev) > THR).mean()))
    prev = y
p.wait()
lum = np.array(lum)
ch = np.array(ch)
n = len(lum)
print(f'frames {n}')
print(f'luma min {lum.min():.1f} (f{int(lum.argmin())}) mean {lum.mean():.1f} max {lum.max():.1f}; under 28: {int((lum < 28).sum())}')
for thr in (0.0005, 0.002, 0.005):
    still = ch < thr
    run = best = 0
    end = 0
    for i, s in enumerate(still):
        run = run + 1 if s else 0
        if run > best:
            best, end = run, i
    print(f'near-static (<{thr * 100:.2f}% px changing >{THR:g}): {still.mean() * 100:.1f}% of frames; longest run {best} ending f{end}')
print(f'median changed area {np.median(ch) * 100:.3f}%')
for a, b in ranges:
    seg = ch[a:b + 1]
    print(f'  f{a}-f{b}: <0.05% {np.mean(seg < 0.0005) * 100:.0f}%, <0.2% {np.mean(seg < 0.002) * 100:.0f}%, <0.5% {np.mean(seg < 0.005) * 100:.0f}%, median {np.median(seg) * 100:.3f}%')
if out:
    np.savez(out, lum=lum, ch=ch)
