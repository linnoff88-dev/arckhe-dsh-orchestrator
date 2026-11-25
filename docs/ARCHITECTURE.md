# Arquitetura

```text
Navegador (127.0.0.1)
  ├── :9080 → socat → DSH web em 127.0.0.1:9080 no container
  └── :3000 → Orchestrator HTTP
                    │
                    ├── tmux → codex (sessêo interativa)
                    ├── tmux → claude (sessêo interativa)
                    └── tmux → bash

DSH ── stdio MCP ── orchestrator-mcp.mjs ── HTTP local ── Orchestrator

/workspace ←→ PROJECTS_DIR do host
/home/agent ←→ RUNTIME_HOME_DIR fora de PROJECTS_DIR
```

Há um único container de runtime. Isso permite que DSH, Codex, Claude, Git e `gh` enxerguem exatamente os mesmos arquivos e credenciais, sem dar ao container controle sobre o daemon Docker.

## Rede

O DSH aceita acesso web em loopback. O `socat` cria uma ponte interna em `9081`; o Compose publica essa ponte somente no loopback do host. O painel também é publicado somente em `127.0.0.1`. Para acesso remoto, prefira túnel SSH ou uma VPN autenticada; nêo troque o bind para `0.0.0.0` sem TLS e controle de acesso.

Ollama no host é alcançado por `host.docker.internal`. OpenRouter requer saída HTTPS do container.

## Sessões e worktrees

O servidor cria uma sessêo tmux por agente e grava metadados atomically em `~/.orchestrator/sessions.json`. Um `cwd` é aceito somente se seu caminho real estiver dentro de `/workspace`, inclusive contra escapes por links simbólicos.

Com `worktree: true`, o orchestrator descobre a raiz Git e cria:

```text
/workspace/.orchestrator-worktrees/<repo>/<session-id>
branch: orchestrator/<session-id>
```

O orchestrator nêo faz merge, push ou exclusêo automática. Essas ações continuam explícitas e auditáveis.

## API

Todas as rotas, exceto `/api/health`, exigem `Authorization: Bearer <token>`:

- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/:id/output`
- `POST /api/sessions/:id/input`
- `POST /api/sessions/:id/stop`

O MCP é um adaptador stdio fino sobre essa API. DSH carrega-o pelo patch de perfil em `~/.dsh/profiles/web/cordis.patch.yml`.
