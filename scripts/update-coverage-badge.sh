#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

npx vitest run --coverage 2>/dev/null

summary="$root/src/coverage/coverage-summary.json"
if [[ ! -f "$summary" ]]; then
  echo "error: coverage-summary.json not found" >&2
  exit 1
fi

pct=$(node -e "
  const s = require('$summary');
  console.log(Math.round(s.total.lines.pct));
")

if   (( pct >= 90 )); then color="brightgreen"
elif (( pct >= 80 )); then color="green"
elif (( pct >= 70 )); then color="yellowgreen"
elif (( pct >= 60 )); then color="yellow"
elif (( pct >= 50 )); then color="orange"
else                        color="red"
fi

badge="https://img.shields.io/badge/coverage-${pct}%25-${color}"

sed -i '' -E \
  "s|https://img\.shields\.io/badge/coverage-[0-9]+%25-[a-z]+|${badge}|" \
  "$root/README.md"

echo "updated badge: ${pct}% (${color})"
