#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
target="${1:-all}"
cd "$ROOT_DIR"

login_codex() { docker compose exec runtime codex login; }
login_claude() { docker compose exec runtime claude auth login; }
login_github() { docker compose exec runtime gh auth login; }

case "$target" in
  codex) login_codex ;;
  claude) login_claude ;;
  github|gh) login_github ;;
  all) login_codex; login_claude; login_github ;;
  *) echo "Uso: $0 codex|claude|github|all"; exit 2 ;;
esac
