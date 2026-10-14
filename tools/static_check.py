"""Find frozen stretches and near-empty frames in a rendered clip.

usage: python -I tools/static_check.py <video> [--offset FIRST_ABS_FRAME] [--gap 15] [--thresh 0.35] [--min 45]

Motion is measured as the mean absolute luma difference between frame i and frame i+gap, computed on a
lightly blurred 480x270 copy so film grain does not count as motion. A stretch is reported as FROZEN when
that motion stays under --thresh for at least --min frames. A frame is reported as EMPTY when its luma
standard deviation is under 6 (a flat, featureless frame). Frame numbers printed are absolute (offset added).
"""
import subprocess
import sys

import numpy as np


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    video = args[0]
    opt = {'--offset': 0, '--gap': 15, '--thresh': 0.35, '--min': 45}
    for i, a in enumerate(args):
        if a in opt:
            opt[a] = float(args[i + 1])
    off, gap, thr, mn = int(opt['--offset']), int(opt['--gap']), opt['--thresh'], int(opt['--min'])
    w, h = 480, 270
    cmd = ['ffmpeg', '-v', 'error', '-i', video, '-vf', f'scale={w}:{h},boxblur=2:1,format=gray', '-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    # Keep the frames as uint8 (a full 17k-frame film is ~2.2 GB) and convert one pair at a time.
    frames = np.frombuffer(raw, np.uint8).reshape(-1, h, w)
    n = len(frames)
    f32 = lambda i: frames[i].astype(np.float32)
    motion = np.array([np.abs(f32(i + gap) - f32(i)).mean() for i in range(n - gap)] or [0.0])
    std = np.array([f32(i).std() for i in range(n)])
    frozen, run = [], 0
    for i, m in enumerate(motion):
        if m < thr:
            run += 1
        else:
            if run >= mn:
                frozen.append((i - run, i - 1 + gap))
            run = 0
    if run >= mn:
        frozen.append((len(motion) - run, n - 1))
    empty = [i for i in range(n) if std[i] < 6]
    print(f'{n} frames from {off}; motion median {np.median(motion):.2f}, p10 {np.percentile(motion, 10):.2f}, min {motion.min():.2f}')
    print(f'FROZEN stretches (motion<{thr} for >={mn}f): {len(frozen)}')
    for a, b in frozen:
        print(f'  {a + off}-{b + off}  ({(b - a + 1) / 30:.1f} s)')
    if empty:
        runs, s = [], empty[0]
        for x, y in zip(empty, empty[1:] + [None]):
            if y != x + 1:
                runs.append((s, x))
                s = y
        print(f'EMPTY frames (luma std<6): {len(empty)} in {len(runs)} runs: ' + ', '.join(f'{a + off}-{b + off}' for a, b in runs[:20]))
    else:
        print('EMPTY frames: none')


if __name__ == '__main__':
    main()
