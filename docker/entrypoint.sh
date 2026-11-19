#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p \
  "$HOME/.dsh/profiles/web" \
  "$HOME/.orchestrator" \
  "$HOME/.claude" \
  "$HOME/.codex" \
  "$HOME/.config/gh"

if [[ ! -f "$HOME/.dsh/settings.yaml" ]]; then
  sed \
    -e "s|__OPENROUTER_MODEL__|${DSH_OPENROUTER_MODEL:-openrouter/auto}|g" \
    -e "s|__OLLAMA_MODEL__|${DSH_OLLAMA_MODEL:-qwen3-coder:30b}|g" \
    /opt/dsh-orchestrator/config/dsh-settings.yaml \
    > "$HOME/.dsh/settings.yaml"
fi

if [[ ! -f "$HOME/.dsh/profiles/web/cordis.patch.yml" ]]; then
  cp /opt/dsh-orchestrator/config/cordis.patch.yml "$HOME/.dsh/profiles/web/cordis.patch.yml"
fi

mkdir -p "$HOME/.dsh/skills"
ln -sfn /opt/dsh-orchestrator/skills/dsh-orchestrator "$HOME/.dsh/skills/dsh-orchestrator"

node /opt/dsh-orchestrator/src/server.mjs &
server_pid=$!
socat TCP-LISTEN:9081,bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:9080 &
socat_pid=$!

cleanup() {
  kill "$server_pid" "$socat_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

dsh_entry="$(readlink -f "$(command -v dsh)")"
exec node --expose-internals --max-old-space-size=4096 "$dsh_entry" web --host 127.0.0.1 --port 9080 --no-open
