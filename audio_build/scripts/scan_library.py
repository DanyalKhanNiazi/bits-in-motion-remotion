"""Scan the SFX library: tags + licence exclusion flags. Writes work/library_scan.json"""
import os, re, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
ROOT = r"D:/Assets/01 Audio/Sound Effects"
OUT = os.path.join(os.path.dirname(__file__), "..", "work", "library_scan.json")
EXCL_NAME = re.compile(r"ocular|boom|b00m|chris alan|muctau|csfx|epidemic|^ES_|^AM - |DSGN|COMCam_|MAGShim_|^AMB|gfxfather|delta leaks|editing lair|SFX Producer|EEnE|artlist|^ALSFX_|SBA-\d|Chris ?Alan|8-Bit SFX", re.I)
EXCL_TAG = re.compile(r"ocular|boom|b00m|chris alan|muctau|csfx|epidemic|gfxfather|delta leaks|editing lair|artlist|blastwave|sound ?ideas|soundsnap|splice|envato|audiojungle|freesound|zapsplat|99sounds|soundly|pond5|SFX Producer|Epic Stock Media|MographMotions|Storyblocks", re.I)
EXT = (".wav", ".mp3", ".aif", ".aiff", ".flac", ".ogg")
files = []
for dp, dn, fn in os.walk(ROOT):
    for f in fn:
        if f.lower().endswith(EXT):
            files.append(os.path.join(dp, f).replace("\\", "/"))
def probe(p):
    try:
        r = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", p], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30)
        j = json.loads(r.stdout or "{}")
    except Exception as e:
        return {"path": p, "err": str(e)}
    fmt = j.get("format", {}); st = (j.get("streams") or [{}])[0]
    tags = {k.lower(): v for k, v in (fmt.get("tags") or {}).items()}
    tags.update({k.lower(): v for k, v in (st.get("tags") or {}).items()})
    name = os.path.basename(p)
    tagtxt = " ".join(str(v) for v in tags.values())
    return {"path": p, "dur": float(fmt.get("duration", 0) or 0), "sr": int(st.get("sample_rate", 0) or 0), "ch": st.get("channels"),
            "tags": tags, "excl_name": bool(EXCL_NAME.search(name) or EXCL_NAME.search(p.split("/")[-2] if "/" in p else "")),
            "excl_tag": bool(EXCL_TAG.search(tagtxt)), "tagtxt": tagtxt[:300]}
with ThreadPoolExecutor(24) as ex:
    res = list(ex.map(probe, files))
json.dump(res, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
print(len(res), "files;", sum(r.get("excl_name", False) for r in res), "excluded by name;", sum(r.get("excl_tag", False) for r in res), "flagged by tag")
