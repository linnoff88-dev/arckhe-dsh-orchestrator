# DSH Orchestrator

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## 📖 Guía de uso

Guía completa (landing + paso a paso): **https://inematds.github.io/dsh-orchestrator/guia/es/**

Entorno local, reproducible y autocontenido para usar:

- **DSH** como interfaz/harness principal;
- **Codex CLI** con inicio de sesión interactivo de la cuenta de OpenAI;
- **Claude Code** con inicio de sesión interactivo de la cuenta de Anthropic;
- **Git y GitHub CLI (`gh`)** dentro del mismo workspace;
- sesiones persistentes en **tmux**, operadas desde el navegador, la CLI o las herramientas MCP de DSH;
- **OpenRouter** y **Ollama** como proveedores de DSH;
- worktrees Git opcionales para que los agentes trabajen en paralelo sin compartir archivos modificados.

El proyecto descarga e instala DSH, Codex, Claude Code y las herramientas de desarrollo durante la compilación de la imagen. El proyecto existente `dsh-sandbox` no se modifica.

## Inicio rápido

Requisitos previos: Docker Engine con Compose v2. En Debian/Ubuntu, hay un instalador opcional:

```bash
cd /home/nmaldaner/projetos/dsh-orchestrator
./scripts/install-docker-debian.sh   # solo si Docker aún no existe
./scripts/bootstrap.sh
```

Si el puerto `9080` ya está ocupado por `dsh-sandbox`, cámbielo antes en `.env`:

```dotenv
DSH_HOST_PORT=9082
ORCHESTRATOR_HOST_PORT=3002
```

Inicie sesión de forma interactiva. Las credenciales quedan en el volumen local `data/home`, no en la imagen:

```bash
./scripts/login.sh codex
./scripts/login.sh claude
./scripts/login.sh github
# o los tres en secuencia:
./scripts/login.sh all
```

Configure OpenRouter si quiere usarlo en DSH:

```bash
./scripts/configure-openrouter.sh
```

Abra las URL que informa el bootstrap. El panel del orchestrator solicita el valor de `ORCHESTRATOR_TOKEN` que está en `.env`. DSH recibe automáticamente el orchestrator como servidor MCP.

## Operación diaria

```bash
./scripts/start.sh
./scripts/status.sh
./scripts/logs.sh
./scripts/shell.sh
./scripts/stop.sh
```

Desde la shell del runtime:

```bash
orch list
orch start codex --cwd /workspace/meu-repo --name api --prompt "implemente os testes" --worktree
orch output api-ID --lines 500
orch send api-ID "rode a suíte e corrija as falhas"
orch attach api-ID
```

También es posible crear y controlar sesiones desde el panel web. DSH ve las herramientas MCP:

- `mcp__orchestrator__list_sessions`
- `mcp__orchestrator__start_session`
- `mcp__orchestrator__session_output`
- `mcp__orchestrator__send_to_session`
- `mcp__orchestrator__stop_session`

## Inicios de sesión y claves

Codex y Claude usan el flujo interactivo oficial de sus CLI. No es necesario crear `OPENAI_API_KEY` ni copiar credenciales del host. GitHub usa `gh auth login`. Los tres estados persisten en `RUNTIME_HOME_DIR`, fuera del árbol de proyectos.

OpenRouter es diferente: DSH lee `OPENROUTER_API_KEY` de `.env`. El script de configuración no imprime la clave y el archivo recibe permisos `0600`.

## Qué persiste

- autenticación y configuraciones: directorio definido por `RUNTIME_HOME_DIR`;
- metadatos de las sesiones: `$RUNTIME_HOME_DIR/.orchestrator/sessions.json`;
- historial/configuración de las CLI en sus directorios predeterminados;
- archivos de proyectos y worktrees: directorio del host definido por `PROJECTS_DIR`.

Una sesión de tmux sobrevive al cierre del navegador y a los reinicios del servidor interno. **No** sobrevive a la recreación o detención del contenedor; en esos casos, use las funciones de reanudación de Codex/Claude. Los archivos, historiales y credenciales permanecen.

## Opciones y alternativas investigadas

Este proyecto implementa una capa pequeña y auditable porque DSH debe ser el punto de entrada. Hay soluciones listas para usar que pueden reemplazar el panel si prefiere más funciones:

| Proyecto | Perfil | Observación |
|---|---|---|
| [DeepSteve](https://github.com/deepsteve/deepsteve) | UI web para Claude/Codex, PTY, tmux y worktrees | Es la alternativa lista para usar más cercana a esta arquitectura; el proyecto aún es joven. |
| [Agent Deck](https://github.com/asheshgoplani/agent-deck) | TUI para varios agentes con tmux | Buena opción cuando la terminal es la interfaz principal. |
| [Superset](https://github.com/superset-sh/superset) | Aplicación de escritorio multiagente | Más pulida, pero con licencia Elastic. |
| [Agetor](https://github.com/sibyllinesoft/agetor) | Kanban local y worktrees | Claude interactivo y Codex orientado a ejecuciones. |
| [Squad](https://github.com/bradygaster/squad) | Coordinación multiagente en SQLite | Útil como protocolo de colaboración; no reemplaza el runtime. |
| [Paperclip](https://github.com/paperclipai/paperclip) | Gobernanza, tareas y presupuestos | Más pesado; adecuado para una “empresa de agentes”. |

DSH está en *developer preview*. El formato de las configuraciones y los plugins puede cambiar entre versiones; por eso las versiones del Dockerfile están fijadas y la actualización debe hacerse de forma deliberada.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Operación y autenticación](docs/OPERATIONS.md)
- [Seguridad](docs/SECURITY.md)
- [Desarrollo y actualización](docs/DEVELOPMENT.md)
- [Solución de problemas](docs/TROUBLESHOOTING.md)

## Licencia

MIT. Las herramientas instaladas conservan sus propias licencias y condiciones de uso.
