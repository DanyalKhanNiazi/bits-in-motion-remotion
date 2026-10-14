#!/usr/bin/env bash
# Render episode sections one at a time, retrying up to 3 times and skipping files that already have the right frame count.
#
#   EP=ep05 tools/queue.sh <outdir> S1:0-1581 S2:1582-2810 ...
#
# EP           entry prefix: renders src/entries/${EP}s<N>.tsx, composition S<N> (default ep03)
# CONCURRENCY  Chrome tabs per render (default 6; 12 pushes the 13700K to 100 °C)
# RENDER_TMP   durable temp folder (this PC wipes %TEMP% mid-render); defaults to ../Claude Work/tmp when that exists
# A skipped file can be stale: delete a section's MP4 whenever its code or the kit changed after it was rendered.
cd "$(dirname "$0")/.." || exit 1
OUT="$1"; shift; mkdir -p "$OUT"
EP="${EP:-ep03}"; CONC="${CONCURRENCY:-6}"
if [ -n "$RENDER_TMP" ]; then T="$RENDER_TMP"; elif [ -d "../Claude Work/tmp" ]; then T="$(cd "../Claude Work/tmp" && pwd -W 2>/dev/null || pwd)"; fi
[ -n "$T" ] && export TEMP="$T" TMP="$T"
for job in "$@"; do
  s="${job%%:*}"; r="${job#*:}"; a="${r%-*}"; b="${r#*-}"; want=$((b - a + 1)); n="${s#S}"
  for try in 1 2 3; do
    have=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$OUT/$s.mp4" 2>/dev/null)
    [ "$have" = "$want" ] && { echo "$s ok ($have frames)"; break; }
    node tools/render.mjs "src/entries/${EP}s$n.tsx" "$s" "$OUT/$s.mp4" --frames "$r" --concurrency "$CONC" > "$OUT/$s.log" 2>&1
    echo "$s try $try exit $?"
  done
done
