"""Probe candidate library files: transients, peaks, band shares, f0. Usage: python -I probe.py <file>..."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
for p in sys.argv[1:]:
    x = load(p)
    ons = onsets(x)
    print("==", os.path.basename(p), "dur %.3f peak %.1f TP %.1f" % (x.shape[1] / SR, peak_db(x), true_peak_db(x)), "bands<300/300-1k/1-4k/>4k", band_shares(x))
    for t, l in ons[:12]:
        seg = x[:, int(t * SR) - 48: int(t * SR) + int(0.04 * SR)]
        # decay: time to -30 dB from peak
        m = np.max(np.abs(seg), axis=0); pk = m.max(); ip = m.argmax()
        after = np.where(m[ip:] < pk * 10 ** (-30 / 20))[0]
        dec = (after[0] / SR * 1000) if len(after) else -1
        print("   t=%.4f lvl %.1f  f0~%.0f  bands %s  decay30 %.1fms" % (t, l, f0_estimate(seg, fmin=60, fmax=4000), band_shares(seg), dec))
