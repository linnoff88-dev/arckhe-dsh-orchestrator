---
name: dsh-orchestrator
description: Inicia, acompanha e coordena sessões locais de Codex CLI, Claude Code ou shell através das ferramentas MCP do orchestrator.
---

# DSH Orchestrator

Use esta skill quando uma tarefa puder ser delegada para Codex CLI, Claude Code ou uma sessão shell persistente.

1. Liste as sessões existentes com `mcp__orchestrator__list_sessions` antes de criar uma duplicata.
2. Inicie com `mcp__orchestrator__start_session`. Informe sempre um `cwd` dentro de `/workspace` e uma tarefa específica em `prompt`.
3. Para tarefas concorrentes no mesmo repositório, defina `worktree: true`. Nunca execute dois agentes simultâneos na mesma árvore de trabalho.
4. Consulte progresso com `mcp__orchestrator__session_output`. Envie correções com `mcp__orchestrator__send_to_session`.
5. Não interrompa uma sessão apenas por estar silenciosa. Pare-a somente quando concluída, travada ou por solicitação do usuário.
6. Não copie segredos para prompts, logs ou sessões. As autenticações já são mantidas no runtime.

Prefira Codex para implementação e revisão de código; Claude Code para exploração, planejamento e tarefas de código longas. A escolha é operacional, não uma limitação rígida.
