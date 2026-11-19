#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

command -v docker >/dev/null 2>&1 || {
  echo "Docker não encontrado. Em Debian/Ubuntu, execute: ./scripts/install-docker-debian.sh"
  exit 1
}
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 não encontrado."; exit 1; }

if [[ ! -f "$ENV_FILE" ]]; then
  umask 077
  token="$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')"
  projects_dir="${PROJECTS_DIR:-$(dirname "$ROOT_DIR")}"
  runtime_home_dir="${XDG_DATA_HOME:-$HOME/.local/share}/dsh-orchestrator/home"
  runtime_uid="$(id -u)"
  runtime_gid="$(id -g)"
  port_available() { ! (exec 3<>"/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1; }
  dsh_port=9080
  orchestrator_port=3000
  while ! port_available "$dsh_port"; do ((dsh_port+=1)); done
  while ! port_available "$orchestrator_port"; do ((orchestrator_port+=1)); done
  printf '%s\n' \
    "PROJECTS_DIR=$projects_dir" \
    "RUNTIME_HOME_DIR=$runtime_home_dir" \
    "ORCHESTRATOR_TOKEN=$token" \
    "DSH_HOST_PORT=$dsh_port" \
    "ORCHESTRATOR_HOST_PORT=$orchestrator_port" \
    "RUNTIME_UID=$runtime_uid" \
    "RUNTIME_GID=$runtime_gid" \
    "OPENROUTER_API_KEY=" \
    "DSH_OPENROUTER_MODEL=openrouter/auto" \
    "DSH_OLLAMA_MODEL=qwen3-coder:30b" > "$ENV_FILE"
  echo ".env criado com PROJECTS_DIR=$projects_dir"
fi

runtime_home_dir="$(sed -n 's/^RUNTIME_HOME_DIR=//p' "$ENV_FILE")"
[[ -n "$runtime_home_dir" ]] || { echo "RUNTIME_HOME_DIR ausente no .env"; exit 1; }
mkdir -p "$runtime_home_dir"
chmod 700 "$runtime_home_dir"

cd "$ROOT_DIR"
docker compose config --quiet
docker compose build
docker compose up -d

echo "DSH:          http://127.0.0.1:$(sed -n 's/^DSH_HOST_PORT=//p' "$ENV_FILE")"
echo "Orchestrator: http://127.0.0.1:$(sed -n 's/^ORCHESTRATOR_HOST_PORT=//p' "$ENV_FILE")"
echo "Próximo passo: ./scripts/login.sh all"
