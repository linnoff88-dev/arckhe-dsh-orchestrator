# Segurança

## Modelo de confiança

Codex, Claude Code e DSH executam comandos com escrita em todos os projetos montados em `/workspace`. Trate-os como processos com os mesmos poderes do usuário sobre esse diretório. O container reduz exposição acidental, mas não transforma agentes em código confiável.

Controles aplicados:

- UI e DSH publicados somente em `127.0.0.1`;
- token obrigatório na API do orchestrator;
- usuário não root;
- todas as Linux capabilities removidas e `no-new-privileges`;
- sem socket Docker, modo privilegiado ou rede do host;
- validação de caminho real sob `/workspace`;
- entrada de sessão enviada ao tmux por buffer, sem interpolação em shell;
- credenciais fora da imagem e fora de `PROJECTS_DIR`; `.env` ignorado pelo Git;
- worktrees para reduzir colisões entre agentes.

## Limites conhecidos

- Todo `/workspace` é leitura/escrita. Para projetos sensíveis, monte apenas um diretório específico em `PROJECTS_DIR` ou crie outro runtime.
- A saída à internet é permitida para OpenRouter, autenticação e ferramentas de desenvolvimento. “Modo Ollama” não significa ausência garantida de exfiltração.
- O token do painel é armazenado em `localStorage`. Use somente em dispositivo confiável.
- `git` e `gh` podem fazer commits, pushes e abrir PRs. Configure branch protection e prefira credenciais de menor privilégio.
- Agentes podem ler tokens persistidos pelo mesmo usuário dentro do container. Separe runtimes se precisar de fronteiras de confiança reais.

## Acesso remoto

Use túnel SSH:

```bash
ssh -L 3000:127.0.0.1:3000 -L 9080:127.0.0.1:9080 usuario@maquina
```

Não publique as portas diretamente na LAN/Internet. Se isso for indispensável, coloque um proxy com HTTPS, autenticação forte, rate limiting e cabeçalhos de segurança.
