# DSH Orchestrator

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## 📖 User Guide

Complete guide (landing page + step-by-step instructions): **https://inematds.github.io/dsh-orchestrator/guia/en/**

Local, reproducible, self-contained environment for using:

- **DSH** as the main interface/harness;
- **Codex CLI** with interactive login to your OpenAI account;
- **Claude Code** with interactive login to your Anthropic account;
- **Git and GitHub CLI (`gh`)** within the same workspace;
- persistent **tmux** sessions, operated through a browser, CLI, or DSH MCP tools;
- **OpenRouter** and **Ollama** as DSH providers;
- optional Git worktrees for agents to work in parallel without sharing modified files.

The project downloads and installs DSH, Codex, Claude Code, and development tools while building the image. The existing `dsh-sandbox` project is not modified.

## Quick Start

Prerequisites: Docker Engine with Compose v2. On Debian/Ubuntu, an optional installer is available:

```bash
cd /home/nmaldaner/projetos/dsh-orchestrator
./scripts/install-docker-debian.sh   # only if Docker is not already installed
./scripts/bootstrap.sh
```

If port `9080` is already occupied by `dsh-sandbox`, change it in `.env` first:

```dotenv
DSH_HOST_PORT=9082
ORCHESTRATOR_HOST_PORT=3002
```

Complete the interactive logins. Credentials are stored in the local `data/home` volume, not in the image:

```bash
./scripts/login.sh codex
./scripts/login.sh claude
./scripts/login.sh github
# or all three in sequence:
./scripts/login.sh all
```

Configure OpenRouter if you want to use it in DSH:

```bash
./scripts/configure-openrouter.sh
```

Open the URLs provided by bootstrap. The orchestrator dashboard asks for the value of `ORCHESTRATOR_TOKEN` in `.env`. DSH automatically receives the orchestrator as an MCP server.

## Everyday Operations

```bash
./scripts/start.sh
./scripts/status.sh
./scripts/logs.sh
./scripts/shell.sh
./scripts/stop.sh
```

From inside the runtime shell:

```bash
orch list
orch start codex --cwd /workspace/meu-repo --name api --prompt "implemente os testes" --worktree
orch output api-ID --lines 500
orch send api-ID "rode a suíte e corrija as falhas"
orch attach api-ID
```

You can also create and control sessions in the web dashboard. DSH sees the MCP tools:

- `mcp__orchestrator__list_sessions`
- `mcp__orchestrator__start_session`
- `mcp__orchestrator__session_output`
- `mcp__orchestrator__send_to_session`
- `mcp__orchestrator__stop_session`

## Logins and Keys

Codex and Claude use the CLIs’ official interactive login flows. You do not need to create an `OPENAI_API_KEY` or copy credentials from the host. GitHub uses `gh auth login`. All three states persist in `RUNTIME_HOME_DIR`, outside the project tree.

OpenRouter is different: DSH reads `OPENROUTER_API_KEY` from `.env`. The configuration script does not print the key, and the file is given `0600` permissions.

## What Persists

- authentication and settings: directory defined by `RUNTIME_HOME_DIR`;
- session metadata: `$RUNTIME_HOME_DIR/.orchestrator/sessions.json`;
- CLI history/configuration in their default directories;
- project files and worktrees: host directory defined by `PROJECTS_DIR`.

A tmux session survives closing the browser and restarting the internal server. It does **not** survive container recreation or shutdown; in those cases, use Codex/Claude’s resume features. Files, histories, and credentials remain.

## Choices and Alternatives Researched

This project implements a small, auditable layer because DSH needs to be the entry point. Ready-made solutions can replace the dashboard if you prefer more features:

| Project | Profile | Note |
|---|---|---|
| [DeepSteve](https://github.com/deepsteve/deepsteve) | Web UI for Claude/Codex, PTY, tmux, and worktrees | The closest ready-made alternative to this architecture; still a young project. |
| [Agent Deck](https://github.com/asheshgoplani/agent-deck) | TUI for multiple agents with tmux | Good when the terminal is the main interface. |
| [Superset](https://github.com/superset-sh/superset) | Multi-agent desktop application | More polished, but with an Elastic license. |
| [Agetor](https://github.com/sibyllinesoft/agetor) | Local Kanban and worktrees | Interactive Claude and execution-oriented Codex. |
| [Squad](https://github.com/bradygaster/squad) | Multi-agent coordination in SQLite | Useful as a collaboration protocol; does not replace the runtime. |
| [Paperclip](https://github.com/paperclipai/paperclip) | Governance, tasks, and budgets | Heavier; suited to an “agent company.” |

DSH is in *developer preview*. The configuration and plugin formats may change between versions; therefore, the versions in the Dockerfile are pinned, and updates should be deliberate.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Operations and Authentication](docs/OPERATIONS.md)
- [Security](docs/SECURITY.md)
- [Development and Updates](docs/DEVELOPMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## License

MIT. Installed tools retain their own licenses and terms of use.
