#!/usr/bin/env bash
# Phase 0 diagnostics for v4.1.1 — no prompt/catalog/validator behavior changes.
set -euo pipefail
cd "$(dirname "$0")/.."

URL=$(python3 - <<'PY'
from pathlib import Path
import re
raw=Path('.env').read_text()
print(re.search(r'^EXPO_PUBLIC_SUPABASE_URL=(.*)$', raw, re.M).group(1).strip().strip('"').strip("'"))
PY
)
ANON=$(python3 - <<'PY'
from pathlib import Path
import re
raw=Path('.env').read_text()
print(re.search(r'^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$', raw, re.M).group(1).strip().strip('"').strip("'"))
PY
)
ENDPOINT=$(python3 - <<'PY'
from pathlib import Path
import re
raw=Path('.env').read_text()
m=re.search(r'^EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT=(.*)$', raw, re.M)
print(m.group(1).strip().strip('"').strip("'") if m else "")
PY
)
SERVICE=$(supabase projects api-keys --project-ref xacdawttvtfrdbcwhcqn 2>/dev/null | python3 -c '
import sys,re
text=sys.stdin.read()
m=re.search(r"service_role\s*\|\s*(eyJ[A-Za-z0-9_\-\.]+)", text)
if not m:
  raise SystemExit("no service_role from supabase cli")
print(m.group(1))
')

EMAIL="oneiros.phase0+$(date +%s)@example.com"
PASS="Phase0Diag!$(openssl rand -hex 4)"
echo "Creating temp user $EMAIL ..."
CREATE=$(curl -sS -X POST "$URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE" \
  -H "Authorization: Bearer $SERVICE" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"email_confirm\":true}")
USER_ID=$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("id",""))' "$CREATE")
if [ -z "$USER_ID" ]; then
  echo "Failed to create user: $CREATE"
  exit 1
fi
echo "user_id=$USER_ID"
cleanup() {
  curl -sS -X DELETE "$URL/auth/v1/admin/users/$USER_ID" \
    -H "apikey: $SERVICE" \
    -H "Authorization: Bearer $SERVICE" >/dev/null || true
  echo "cleaned user $USER_ID"
}
trap cleanup EXIT

export LIVE_SUPABASE_EMAIL="$EMAIL"
export LIVE_SUPABASE_PASSWORD="$PASS"
export EXPO_PUBLIC_SUPABASE_URL="$URL"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="$ANON"
export EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT="$ENDPOINT"

npx --yes tsx scripts/phase0-v411-diagnostics.ts
