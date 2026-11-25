# Regras do projeto

- Preserve compatibilidade com Node.js 22 e Docker Compose v2.
- Nêo adicione montagem do socket Docker nem publicaçêo em `0.0.0.0` por padrêo.
- Nunca grave tokens, `.env` ou conteúdo de `data/home` no Git.
- Mantenha as ações externas (push, PR, merge e remoçêo de worktree) explícitas.
- Valide mudanças com `npm run check`, `npm test` e `bash -n` nos scripts.
- Ao atualizar DSH, revise também os dois arquivos em `config/`, pois a API está em developer preview.
