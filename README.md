# DSH Orchestrator

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="48" />
  <p><strong>Arckhé AI</strong></p>
</div>


**ê°Å¸â¡Â§ê°Å¸â¡Â· [PortuguêÂªs](README.md) êÂ· ê°Å¸â¡Âºê°Å¸â¡Â¸ [English](README.en.md) êÂ· ê°Å¸â¡Âªê°Å¸â¡Â¸ [EspaêÂ±ol](README.es.md)**

## ê°Å¸ââ Guia de uso

Guia completo (landing + passo a passo): **https://linnoff88-dev.github.io/

Ambiente local, reproduzêÂ­vel e autocontido para usar:

- **DSH** como interface/harness principal;
- **Codex CLI** com login interativo da conta OpenAI;
- **Claude Code** com login interativo da conta Anthropic;
- **Git e GitHub CLI (`gh`)** dentro do mesmo workspace;
- sessêÂµes persistentes em **tmux**, operadas por navegador, CLI ou ferramentas MCP do DSH;
- **OpenRouter** e **Ollama** como provedores do DSH;
- worktrees Git opcionais para agentes trabalharem em paralelo sem compartilhar arquivos modificados.

O projeto baixa e instala DSH, Codex, Claude Code e as ferramentas de desenvolvimento durante o build da imagem. O projeto existente `dsh-sandbox` nêÂ£o êÂ© alterado.

## InêÂ­cio rêÂ¡pido

PrêÂ©-requisitos: Docker Engine com Compose v2. Em Debian/Ubuntu, hêÂ¡ um instalador opcional:

```bash
cd /home/nmaldaner/projetos/dsh-orchestrator
./scripts/install-docker-debian.sh   # somente se Docker ainda nêÂ£o existir
./scripts/bootstrap.sh
```

Se a porta `9080` jêÂ¡ estiver ocupada pelo `dsh-sandbox`, mude antes em `.env`:

```dotenv
DSH_HOST_PORT=9082
ORCHESTRATOR_HOST_PORT=3002
```

FaêÂ§a os logins interativos. As credenciais ficam no volume local `data/home`, nêÂ£o na imagem:

```bash
./scripts/login.sh codex
./scripts/login.sh claude
./scripts/login.sh github
# ou os trêÂªs em sequêÂªncia:
./scripts/login.sh all
```

Configure OpenRouter, se quiser usêÂ¡-lo no DSH:

```bash
./scripts/configure-openrouter.sh
```

Abra as URLs informadas pelo bootstrap. O painel do orchestrator pede o valor de `ORCHESTRATOR_TOKEN` existente em `.env`. O DSH recebe o orchestrator automaticamente como servidor MCP.

## OperaêÂ§êÂ£o cotidiana

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
orch send api-ID "rode a suêÂ­te e corrija as falhas"
orch attach api-ID
```

TambêÂ©m êÂ© possêÂ­vel criar e controlar sessêÂµes no painel web. O DSH vêÂª as ferramentas MCP:

- `mcp__orchestrator__list_sessions`
- `mcp__orchestrator__start_session`
- `mcp__orchestrator__session_output`
- `mcp__orchestrator__send_to_session`
- `mcp__orchestrator__stop_session`

### AtualizaêÂ§êÂ£o de seguranêÂ§a (Node e certificados)

NêÂ£o recompile do zero para atualizar o Node ou a lista de certificados: o `build --pull` traz versêÂµes novas dos plugins `cordis` e o DSH deixa de subir. Use a camada de `docker/Dockerfile.seguranca`, que parte da imagem que funciona e troca sêÂ³ o Node e o `ca-certificates`. Antes, guarde a imagem atual com uma tag de reserva; depois, confira `./scripts/status.sh` e o painel web. Guia completo: <https://linnoff88-dev.github.io/

## Logins e chaves

Codex e Claude usam o fluxo interativo oficial dos CLIs. NêÂ£o êÂ© necessêÂ¡rio criar `OPENAI_API_KEY` nem copiar credenciais do host. O GitHub usa `gh auth login`. Os trêÂªs estados persistem em `RUNTIME_HOME_DIR`, fora da êÂ¡rvore de projetos.

OpenRouter êÂ© diferente: o DSH lêÂª `OPENROUTER_API_KEY` do `.env`. O script de configuraêÂ§êÂ£o nêÂ£o imprime a chave e o arquivo recebe permissêÂ£o `0600`.

## O que persiste

- autenticaêÂ§êÂ£o e configuraêÂ§êÂµes: diretêÂ³rio definido por `RUNTIME_HOME_DIR`;
- metadados de sessêÂµes: `$RUNTIME_HOME_DIR/.orchestrator/sessions.json`;
- histêÂ³rico/configuraêÂ§êÂ£o dos CLIs em seus diretêÂ³rios padrêÂ£o;
- arquivos dos projetos e worktrees: diretêÂ³rio do host definido por `PROJECTS_DIR`.

Uma sessêÂ£o tmux sobrevive ao fechamento do navegador e a reinêÂ­cios do servidor interno. Ela **nêÂ£o** sobrevive êÂ  recriaêÂ§êÂ£o ou parada do container; nesses casos, use os recursos de retomada do Codex/Claude. Os arquivos, histêÂ³ricos e credenciais permanecem.

## Escolhas e alternativas pesquisadas

Este projeto implementa uma camada pequena e auditêÂ¡vel porque o DSH precisa ser o ponto de entrada. HêÂ¡ soluêÂ§êÂµes prontas que podem substituir o painel caso vocêÂª prefira mais recursos:

| Projeto | Perfil | ObservaêÂ§êÂ£o |
|---|---|---|
| [DeepSteve](https://github.com/deepsteve/deepsteve) | UI web para Claude/Codex, PTY, tmux e worktrees | êâ° a alternativa pronta mais prêÂ³xima desta arquitetura; projeto ainda jovem. |
| [Agent Deck](https://github.com/asheshgoplani/agent-deck) | TUI para mêÂºltiplos agentes com tmux | Bom quando o terminal êÂ© a interface principal. |
| [Superset](https://github.com/superset-sh/superset) | Aplicativo desktop multiagente | Mais polido, porêÂ©m com licenêÂ§a Elastic. |
| [Agetor](https://github.com/sibyllinesoft/agetor) | Kanban local e worktrees | Claude interativo e Codex orientado a execuêÂ§êÂµes. |
| [Squad](https://github.com/bradygaster/squad) | CoordenaêÂ§êÂ£o multiagente em SQLite | êÅ¡til como protocolo de colaboraêÂ§êÂ£o, nêÂ£o substitui o runtime. |
| [Paperclip](https://github.com/paperclipai/paperclip) | GovernanêÂ§a, tarefas e budgets | Mais pesado; adequado a uma ê¢â¬Åempresa de agentesê¢â¬Â. |

O DSH estêÂ¡ em *developer preview*. O formato de configuraêÂ§êÂµes e plugins pode mudar entre versêÂµes; por isso as versêÂµes no Dockerfile sêÂ£o fixadas e a atualizaêÂ§êÂ£o deve ser deliberada.

## DocumentaêÂ§êÂ£o

- [Arquitetura](docs/ARCHITECTURE.md)
- [OperaêÂ§êÂ£o e autenticaêÂ§êÂ£o](docs/OPERATIONS.md)
- [SeguranêÂ§a](docs/SECURITY.md)
- [Desenvolvimento e atualizaêÂ§êÂ£o](docs/DEVELOPMENT.md)
- [SoluêÂ§êÂ£o de problemas](docs/TROUBLESHOOTING.md)

## LicenêÂ§a

MIT. As ferramentas instaladas mantêÂªm suas prêÂ³prias licenêÂ§as e termos de uso.

---

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="32" />
  <p><strong>Arckhé AI</strong></p>
</div>