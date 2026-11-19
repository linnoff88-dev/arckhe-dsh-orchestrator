# DSH Orchestrator

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="48" />
  <p><strong>Arckhé AI</strong></p>
</div>


**ðŸ‡§ðŸ‡· [PortuguÃªs](README.md) Â· ðŸ‡ºðŸ‡¸ [English](README.en.md) Â· ðŸ‡ªðŸ‡¸ [EspaÃ±ol](README.es.md)**

## ðŸ“– Guia de uso

Guia completo (landing + passo a passo): **https://inematds.github.io/dsh-orchestrator/guia/**

Ambiente local, reproduzÃ­vel e autocontido para usar:

- **DSH** como interface/harness principal;
- **Codex CLI** com login interativo da conta OpenAI;
- **Claude Code** com login interativo da conta Anthropic;
- **Git e GitHub CLI (`gh`)** dentro do mesmo workspace;
- sessÃµes persistentes em **tmux**, operadas por navegador, CLI ou ferramentas MCP do DSH;
- **OpenRouter** e **Ollama** como provedores do DSH;
- worktrees Git opcionais para agentes trabalharem em paralelo sem compartilhar arquivos modificados.

O projeto baixa e instala DSH, Codex, Claude Code e as ferramentas de desenvolvimento durante o build da imagem. O projeto existente `dsh-sandbox` nÃ£o Ã© alterado.

## InÃ­cio rÃ¡pido

PrÃ©-requisitos: Docker Engine com Compose v2. Em Debian/Ubuntu, hÃ¡ um instalador opcional:

```bash
cd /home/nmaldaner/projetos/dsh-orchestrator
./scripts/install-docker-debian.sh   # somente se Docker ainda nÃ£o existir
./scripts/bootstrap.sh
```

Se a porta `9080` jÃ¡ estiver ocupada pelo `dsh-sandbox`, mude antes em `.env`:

```dotenv
DSH_HOST_PORT=9082
ORCHESTRATOR_HOST_PORT=3002
```

FaÃ§a os logins interativos. As credenciais ficam no volume local `data/home`, nÃ£o na imagem:

```bash
./scripts/login.sh codex
./scripts/login.sh claude
./scripts/login.sh github
# ou os trÃªs em sequÃªncia:
./scripts/login.sh all
```

Configure OpenRouter, se quiser usÃ¡-lo no DSH:

```bash
./scripts/configure-openrouter.sh
```

Abra as URLs informadas pelo bootstrap. O painel do orchestrator pede o valor de `ORCHESTRATOR_TOKEN` existente em `.env`. O DSH recebe o orchestrator automaticamente como servidor MCP.

## OperaÃ§Ã£o cotidiana

```bash
./scripts/start.sh
./scripts/status.sh
./scripts/logs.sh
./scripts/shell.sh
./scripts/stop.sh
```

De dentro do shell do runtime:

```bash
orch list
orch start codex --cwd /workspace/meu-repo --name api --prompt "implemente os testes" --worktree
orch output api-ID --lines 500
orch send api-ID "rode a suÃ­te e corrija as falhas"
orch attach api-ID
```

TambÃ©m Ã© possÃ­vel criar e controlar sessÃµes no painel web. O DSH vÃª as ferramentas MCP:

- `mcp__orchestrator__list_sessions`
- `mcp__orchestrator__start_session`
- `mcp__orchestrator__session_output`
- `mcp__orchestrator__send_to_session`
- `mcp__orchestrator__stop_session`

### AtualizaÃ§Ã£o de seguranÃ§a (Node e certificados)

NÃ£o recompile do zero para atualizar o Node ou a lista de certificados: o `build --pull` traz versÃµes novas dos plugins `cordis` e o DSH deixa de subir. Use a camada de `docker/Dockerfile.seguranca`, que parte da imagem que funciona e troca sÃ³ o Node e o `ca-certificates`. Antes, guarde a imagem atual com uma tag de reserva; depois, confira `./scripts/status.sh` e o painel web. Guia completo: <https://inematds.github.io/auditoria-seguranca/guia/>.

## Logins e chaves

Codex e Claude usam o fluxo interativo oficial dos CLIs. NÃ£o Ã© necessÃ¡rio criar `OPENAI_API_KEY` nem copiar credenciais do host. O GitHub usa `gh auth login`. Os trÃªs estados persistem em `RUNTIME_HOME_DIR`, fora da Ã¡rvore de projetos.

OpenRouter Ã© diferente: o DSH lÃª `OPENROUTER_API_KEY` do `.env`. O script de configuraÃ§Ã£o nÃ£o imprime a chave e o arquivo recebe permissÃ£o `0600`.

## O que persiste

- autenticaÃ§Ã£o e configuraÃ§Ãµes: diretÃ³rio definido por `RUNTIME_HOME_DIR`;
- metadados de sessÃµes: `$RUNTIME_HOME_DIR/.orchestrator/sessions.json`;
- histÃ³rico/configuraÃ§Ã£o dos CLIs em seus diretÃ³rios padrÃ£o;
- arquivos dos projetos e worktrees: diretÃ³rio do host definido por `PROJECTS_DIR`.

Uma sessÃ£o tmux sobrevive ao fechamento do navegador e a reinÃ­cios do servidor interno. Ela **nÃ£o** sobrevive Ã  recriaÃ§Ã£o ou parada do container; nesses casos, use os recursos de retomada do Codex/Claude. Os arquivos, histÃ³ricos e credenciais permanecem.

## Escolhas e alternativas pesquisadas

Este projeto implementa uma camada pequena e auditÃ¡vel porque o DSH precisa ser o ponto de entrada. HÃ¡ soluÃ§Ãµes prontas que podem substituir o painel caso vocÃª prefira mais recursos:

| Projeto | Perfil | ObservaÃ§Ã£o |
|---|---|---|
| [DeepSteve](https://github.com/deepsteve/deepsteve) | UI web para Claude/Codex, PTY, tmux e worktrees | Ã‰ a alternativa pronta mais prÃ³xima desta arquitetura; projeto ainda jovem. |
| [Agent Deck](https://github.com/asheshgoplani/agent-deck) | TUI para mÃºltiplos agentes com tmux | Bom quando o terminal Ã© a interface principal. |
| [Superset](https://github.com/superset-sh/superset) | Aplicativo desktop multiagente | Mais polido, porÃ©m com licenÃ§a Elastic. |
| [Agetor](https://github.com/sibyllinesoft/agetor) | Kanban local e worktrees | Claude interativo e Codex orientado a execuÃ§Ãµes. |
| [Squad](https://github.com/bradygaster/squad) | CoordenaÃ§Ã£o multiagente em SQLite | Ãštil como protocolo de colaboraÃ§Ã£o, nÃ£o substitui o runtime. |
| [Paperclip](https://github.com/paperclipai/paperclip) | GovernanÃ§a, tarefas e budgets | Mais pesado; adequado a uma â€œempresa de agentesâ€. |

O DSH estÃ¡ em *developer preview*. O formato de configuraÃ§Ãµes e plugins pode mudar entre versÃµes; por isso as versÃµes no Dockerfile sÃ£o fixadas e a atualizaÃ§Ã£o deve ser deliberada.

## DocumentaÃ§Ã£o

- [Arquitetura](docs/ARCHITECTURE.md)
- [OperaÃ§Ã£o e autenticaÃ§Ã£o](docs/OPERATIONS.md)
- [SeguranÃ§a](docs/SECURITY.md)
- [Desenvolvimento e atualizaÃ§Ã£o](docs/DEVELOPMENT.md)
- [SoluÃ§Ã£o de problemas](docs/TROUBLESHOOTING.md)

## LicenÃ§a

MIT. As ferramentas instaladas mantÃªm suas prÃ³prias licenÃ§as e termos de uso.

---

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="32" />
  <p><strong>Arckhé AI</strong></p>
</div>