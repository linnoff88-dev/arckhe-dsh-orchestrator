FROM node:22-bookworm-slim

ARG RUNTIME_UID=1000
ARG RUNTIME_GID=1000
ARG DSH_VERSION=0.1.1-rc.2
ARG CODEX_VERSION=0.149.1
ARG CLAUDE_CODE_VERSION=2.1.241

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      bash build-essential ca-certificates curl git gh jq less openssh-client \
      procps python3 python3-pip ripgrep socat tmux tini \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global \
      "@deepseek-ai/dsh@${DSH_VERSION}" \
      "@openai/codex@${CODEX_VERSION}" \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
    && npm cache clean --force

RUN userdel --remove node \
    && groupadd --gid "${RUNTIME_GID}" agent \
    && useradd --uid "${RUNTIME_UID}" --gid "${RUNTIME_GID}" --create-home --shell /bin/bash agent

WORKDIR /opt/dsh-orchestrator
COPY --chown=agent:agent package.json ./
COPY --chown=agent:agent src ./src
COPY --chown=agent:agent static ./static
COPY --chown=agent:agent bin ./bin
COPY --chown=agent:agent config ./config
COPY --chown=agent:agent skills ./skills
COPY --chown=agent:agent docker/entrypoint.sh /usr/local/bin/dsh-orchestrator-entrypoint
RUN chmod +x /usr/local/bin/dsh-orchestrator-entrypoint /opt/dsh-orchestrator/bin/*.mjs \
    && ln -s /opt/dsh-orchestrator/bin/orch.mjs /usr/local/bin/orch

USER agent
ENV HOME=/home/agent
EXPOSE 3000 9081
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/dsh-orchestrator-entrypoint"]
