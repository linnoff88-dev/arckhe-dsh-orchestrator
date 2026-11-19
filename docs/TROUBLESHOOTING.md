# Solução de problemas

## Porta já está em uso

O `dsh-sandbox` existente provavelmente usa `9080`. Defina outras portas no `.env` e execute `docker compose up -d`:

```dotenv
DSH_HOST_PORT=9082
ORCHESTRATOR_HOST_PORT=3002
```

## Permissão negada em `RUNTIME_HOME_DIR` ou projetos

Confira `RUNTIME_UID` e `RUNTIME_GID` no `.env` com `id -u` e `id -g`, depois reconstrua a imagem.

## Login desapareceu

Confirme que `RUNTIME_HOME_DIR:/home/agent` aparece em `docker compose config`. Rode os status dentro do container e repita somente o login afetado.

## OpenRouter retorna 401

Execute novamente `./scripts/configure-openrouter.sh` e veja apenas se a variável está presente, sem imprimi-la:

```bash
docker compose exec runtime bash -lc 'test -n "$OPENROUTER_API_KEY" && echo presente || echo ausente'
```

## Ollama não responde

`127.0.0.1` do host não é o loopback do container. O template usa `host.docker.internal`; verifique o bind e firewall do Ollama, e teste `curl http://host.docker.internal:11434/api/tags` dentro do runtime.

## DSH não mostra ferramentas MCP

Confira:

```bash
docker compose exec runtime sed -n '1,120p' /home/agent/.dsh/profiles/web/cordis.patch.yml
docker compose exec runtime node /opt/dsh-orchestrator/bin/orchestrator-mcp.mjs
```

No segundo comando, envie uma linha JSON-RPC `initialize`. Veja os logs do DSH para erros do plugin `@deepseek-ai/dsh-mcp-client`.

## Sessão encerrada após recriar o container

Isso é esperado. Arquivos e autenticação persistem, mas processos tmux não. Use `codex resume` ou `claude --resume` no shell, ou abra uma nova sessão apontando para o mesmo worktree.
