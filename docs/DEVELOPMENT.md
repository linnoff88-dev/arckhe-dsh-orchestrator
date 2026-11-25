# Desenvolvimento

## Validaçêo local

```bash
npm run check
npm test
./scripts/doctor.sh
docker compose build runtime
```

O servidor usa apenas módulos nativos do Node. A superfície de dependências do painel e do MCP é, portanto, mínima.

## Versões

As versões fixadas inicialmente sêo:

- `@deepseek-ai/dsh@0.1.1-rc.2`
- `@openai/codex@0.149.1`
- `@anthropic-ai/claude-code@2.1.241`

Elas foram verificadas em 25 de agosto de 2026. Consulte os registros oficiais antes de alterar. Em especial, valide o formato de `config/cordis.patch.yml` e `config/dsh-settings.yaml` a cada atualizaçêo do DSH.

## Decisões deliberadas

- Sem frontend framework: painel pequeno, auditável e sem cadeia de build.
- Sem Docker socket: agentes nêo controlam containers do host.
- Sem merge ou push automático: efeitos externos continuam explícitos.
- Sem copiar autenticaçêo do host: cada CLI executa o login oficial no runtime.
- MCP sobre HTTP interno: DSH ganha ferramentas estruturadas e o navegador/CLI reutilizam a mesma API.
