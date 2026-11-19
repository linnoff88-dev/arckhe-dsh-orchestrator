#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail=0
for command_name in docker node; do
  if command -v "$command_name" >/dev/null 2>&1; then echo "ok: $command_name"; else echo "ausente: $command_name"; fail=1; fi
done
docker compose version >/dev/null 2>&1 && echo "ok: docker compose" || { echo "ausente: docker compose v2"; fail=1; }
[[ -f .env ]] && echo "ok: .env" || { echo "ausente: .env (execute bootstrap.sh)"; fail=1; }
node --check src/server.mjs
node --check src/lib.mjs
node --check bin/orch.mjs
node --check bin/orchestrator-mcp.mjs
for script in scripts/*.sh docker/entrypoint.sh; do bash -n "$script"; done
if [[ -f .env ]]; then docker compose config --quiet && echo "ok: compose"; fi
exit "$fail"
