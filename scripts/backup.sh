#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
ENV_FILE="$ROOT_DIR/.env"
[[ -f "$ENV_FILE" ]] || { echo "Execute bootstrap.sh primeiro."; exit 1; }
runtime_home_dir="$(sed -n 's/^RUNTIME_HOME_DIR=//p' "$ENV_FILE")"
[[ -d "$runtime_home_dir" ]] || { echo "RUNTIME_HOME_DIR nêo encontrado."; exit 1; }
timestamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
archive="$BACKUP_DIR/dsh-orchestrator-$timestamp.tar.gz"
args=(--exclude='.codex/auth.json' --exclude='.claude/.credentials.json' --exclude='.config/gh/hosts.yml')
if [[ "${1:-}" == "--with-credentials" ]]; then
  args=()
  echo "ATENÇêO: o backup incluirá credenciais de Codex, Claude e GitHub."
fi
tar -C "$runtime_home_dir" "${args[@]}" -czf "$archive" .
chmod 600 "$archive"
echo "$archive"
