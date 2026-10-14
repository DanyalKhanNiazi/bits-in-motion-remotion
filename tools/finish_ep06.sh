#!/usr/bin/env bash
# Finish Episode 06 on the owner's PC: full-resolution render, join, checks, mix, mux, loudness report.
#
#   bash tools/finish_ep06.sh            # from Git Bash, in the project folder
#   FRESH=1 bash tools/finish_ep06.sh    # delete earlier section renders first (do this after any code change)
#
# Needs: node + npm ci done, ffmpeg/ffprobe on PATH, python (with numpy) for the checks and the mixer,
# and the locked voice at F:/YouTube Channels/Bits in Motion/Videos/06 Why Deleting a File Doesn't Erase It/Voiceover/fullvoiceover.mp3.
# Expected time on the 13700K: about 1–1.5 h of rendering at concurrency 6. Close Codex and other heavy jobs first (CPU heat).
set -u
cd "$(dirname "$0")/.." || exit 1

WORK="../Claude Work/Episode 06 - File Deletion"
R="$WORK/render/final"
AUDIO="$WORK/audio/ep06_mix.wav"
EXPORT="$WORK/exports/Bits_in_Motion_06_1080p.mp4"
TOTAL=17023
PY=python; command -v "$PY" >/dev/null 2>&1 || PY=python3
mkdir -p "$R" "$WORK/audio" "$WORK/exports"

# Sections (absolute frames, inclusive) = src/ep06/sections.ts
SECTIONS=(S1:0-1408 S2:1409-3166 S3:3167-5103 S4:5104-6648 S5:6649-8403 S6:8404-9934 S7:9935-11975 S8:11976-14746 S9:14747-17022)

fail() { echo "FINISH FAILED: $*" >&2; exit 1; }
frames() { ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$1" 2>/dev/null; }

if [ "${FRESH:-0}" = "1" ]; then
  echo "== FRESH=1: removing earlier section renders in $R"
  for job in "${SECTIONS[@]}"; do rm -f "$R/${job%%:*}.mp4"; done
fi

echo "== 1/6 render the 9 sections at 1080p (one at a time, retries, skips valid files)"
EP=ep06 CONCURRENCY="${CONCURRENCY:-6}" bash tools/queue.sh "$R" "${SECTIONS[@]}"
for job in "${SECTIONS[@]}"; do
  s="${job%%:*}"; r="${job#*:}"; want=$(( ${r#*-} - ${r%-*} + 1 ))
  have=$(frames "$R/$s.mp4")
  [ "$have" = "$want" ] || fail "$s has ${have:-no} frames, expected $want (see $R/$s.log)"
done

echo "== 2/6 join with the concat demuxer"
FILM="$R/ep06_film.mp4"
: > "$R/list.txt"
for job in "${SECTIONS[@]}"; do echo "file '${job%%:*}.mp4'" >> "$R/list.txt"; done
ffmpeg -v error -y -f concat -safe 0 -i "$R/list.txt" -c copy "$FILM" || fail "concat"
n=$(frames "$FILM"); echo "film frames: $n (expected $TOTAL)"
[ "$n" = "$TOTAL" ] || fail "joined film has $n frames, expected $TOTAL"

echo "== 3/6 static check (frozen stretches, empty frames)"
"$PY" -I tools/static_check.py "$FILM" || fail "static_check"

echo "== 4/6 mix (voice + music + cues from src/ep06/sections/S*.cues.json)"
"$PY" -I audio_build/ep06/build_mix.py --out "$AUDIO" || fail "build_mix"
[ -f "$AUDIO" ] || fail "no mix at $AUDIO"

echo "== 5/6 mux (apad + shortest keeps the last video frame)"
ffmpeg -v error -y -i "$FILM" -i "$AUDIO" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -af apad -shortest -movflags +faststart "$EXPORT" || fail "mux"

echo "== 6/6 report"
n=$(frames "$EXPORT"); echo "export frames: $n (expected $TOTAL)"
ffmpeg -hide_banner -nostats -i "$EXPORT" -map 0:a:0 -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p'
[ "$n" = "$TOTAL" ] || fail "export has $n frames, expected $TOTAL"
echo "DONE: $EXPORT"
