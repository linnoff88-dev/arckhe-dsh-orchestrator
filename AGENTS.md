# Regras do projeto

- Preserve compatibilidade com Node.js 22 e Docker Compose v2.
- Não adicione montagem do socket Docker nem publicação em `0.0.0.0` por padrão.
- Nunca grave tokens, `.env` ou conteúdo de `data/home` no Git.
- Mantenha as ações externas (push, PR, merge e remoção de worktree) explícitas.
- Valide mudanças com `npm run check`, `npm test` e `bash -n` nos scripts.
- Ao atualizar DSH, revise também os dois arquivos em `config/`, pois a API está em developer preview.
