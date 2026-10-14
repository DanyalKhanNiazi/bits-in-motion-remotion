#!/bin/bash
# Cloud sessions only: make Remotion's headless Chrome trust the sandbox's egress CAs.
# Remotion launches Chrome with --proxy-server='direct://', so it bypasses the agent proxy and meets
# the transparent egress gateway instead. The system trust store has those CAs; Chrome's NSS store
# (~/.pki/nssdb) does not, so Google Fonts fail with ERR_CERT_AUTHORITY_INVALID. This copies them in.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

CA_DIR=/usr/local/share/ca-certificates
DB="sql:$HOME/.pki/nssdb"

if ! command -v certutil >/dev/null 2>&1; then
  apt-get install -y -qq libnss3-tools >/dev/null 2>&1 || true
fi

if command -v certutil >/dev/null 2>&1; then
  mkdir -p "$HOME/.pki/nssdb"
  [ -f "$HOME/.pki/nssdb/cert9.db" ] || certutil -N --empty-password -d "$DB"
  for n in egress-gateway-ca-production egress-gateway-ca-staging swp-ca-production swp-ca-staging; do
    [ -f "$CA_DIR/$n.crt" ] || continue
    certutil -L -d "$DB" -n "$n" >/dev/null 2>&1 || certutil -A -d "$DB" -n "$n" -t "C,," -i "$CA_DIR/$n.crt"
  done
else
  echo "session-start: certutil unavailable; Chrome may reject fonts.gstatic.com" >&2
fi

# No GPU in the cloud VM: software WebGL for tools/render.mjs and tools/stills.mjs.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export REMOTION_GL=swangle' >> "$CLAUDE_ENV_FILE"
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
[ -d node_modules ] || npm install --no-audit --no-fund
