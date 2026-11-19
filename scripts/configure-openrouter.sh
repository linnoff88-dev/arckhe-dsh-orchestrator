#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
[[ -f "$ENV_FILE" ]] || { echo "Execute ./scripts/bootstrap.sh primeiro."; exit 1; }

read -rsp "OPENROUTER_API_KEY: " secret
echo
[[ -n "$secret" ]] || { echo "Chave vazia; nada alterado."; exit 1; }
printf '%s' "$secret" | node "$ROOT_DIR/bin/set-env.mjs" "$ENV_FILE" OPENROUTER_API_KEY
unset secret
chmod 600 "$ENV_FILE"
cd "$ROOT_DIR"
docker compose up -d --force-recreate runtime
echo "OpenRouter configurado e runtime recriado."
