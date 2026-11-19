# Operação e autenticação

## Primeira inicialização

`bootstrap.sh` cria `.env`, gera um token aleatório, usa o diretório pai como `PROJECTS_DIR`, escolhe portas locais livres, cria `RUNTIME_HOME_DIR` fora dos projetos, constrói a imagem e inicia o runtime. Ele não instala Docker automaticamente nem modifica o `dsh-sandbox` existente.

Se o usuário do host não tiver UID/GID 1000, os valores reais são colocados no `.env` e usados na construção da imagem para evitar arquivos com proprietário incorreto.

## Login interativo da conta

```bash
./scripts/login.sh codex    # codex login
./scripts/login.sh claude   # claude auth login
./scripts/login.sh github   # gh auth login
```

O fluxo abre uma URL ou apresenta um código de dispositivo conforme decidido pelo provedor. Conclua no navegador e volte ao terminal. Para conferir:

```bash
./scripts/shell.sh
codex login status
claude auth status
gh auth status
```

Não compartilhe `RUNTIME_HOME_DIR`, porque ele passa a conter tokens reutilizáveis.

## DSH com OpenRouter

Execute `./scripts/configure-openrouter.sh`. O modelo inicial é `openrouter/auto`; altere `DSH_OPENROUTER_MODEL` em `.env` e remova `data/home/.dsh/settings.yaml` para regenerar o arquivo, ou edite diretamente esse arquivo persistente.

## DSH com Ollama

O modelo inicial é `qwen3-coder:30b`. Instale-o no host e mantenha Ollama escutando uma interface alcançável pelo Docker. Em Linux, isso pode exigir configurar o bind do serviço além de `127.0.0.1`. Teste de dentro do runtime:

```bash
curl -fsS http://host.docker.internal:11434/api/tags | jq
```

## Atualizar o runtime

Altere as versões fixadas nos `build.args` de `compose.yaml`, leia as notas de versão e então:

```bash
docker compose build --no-cache runtime
docker compose up -d --force-recreate runtime
```

Faça backup antes de atualizar o DSH, pois ele ainda está em developer preview.

## Backup

```bash
./scripts/backup.sh                    # exclui credenciais
./scripts/backup.sh --with-credentials # inclui tokens; arquivo altamente sensível
```

O backup não inclui os projetos porque eles já vivem em `PROJECTS_DIR`.
