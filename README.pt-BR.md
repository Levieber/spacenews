# spacenews

> 🇺🇸 [Read in English](README.md)

Minha versão do [TabNews](https://www.tabnews.com.br), feita durante o [curso.dev](https://curso.dev). O nome é uma piada de Space vs Tab para indentação.

**No ar:** https://spacenews.levieber.com.br · **Página de status:** https://spacenews.levieber.com.br/status

O projeto começa pelo backend: API, banco de dados e autenticação vêm antes da interface.

## O que tem

- **API REST versionada** (`/api/v1`) com rotas de API do Next.js: usuários, sessões, ativação de conta, migrations e status do sistema.
- **Cadastro com ativação por email:** a conta nova recebe um token de ativação por email e só consegue fazer login depois de ativada.
- **Sessões** guardadas no PostgreSQL atrás de um cookie, com senhas com hash bcrypt.
- **Autorização por features:** cada usuário tem uma lista de features (`create:session`, `update:user:others`, `read:status:all`, …) e toda rota confere essa lista, inclusive se um usuário pode alterar os dados de outro.
- **Migrations SQL** com `node-pg-migrate`, aplicadas pela própria API (`/api/v1/migrations`).
- **Página de status** com a versão do banco, conexões e outros dados de saúde.

## Como é testado

Os testes de integração rodam a stack de verdade: Next.js, PostgreSQL e um servidor SMTP Mailcatcher, subidos com Docker Compose. Cada rota e método da API tem seu próprio arquivo de teste em `tests/integration/api/v1/`, além de um teste do fluxo de cadastro completo (cadastro → email de ativação → ativação → login) e testes unitários das regras de autorização.

O CI roda em todo pull request: os testes, formatação (oxfmt), qualidade de código (oxlint), dependências não usadas (knip) e Conventional Commits (commitlint).

## Stack

Next.js · React · PostgreSQL · node-pg-migrate · Nodemailer · Vitest · Docker Compose · GitHub Actions

## Rodando localmente

Você precisa de Node.js, pnpm e Docker.

```sh
pnpm install
pnpm dev     # sobe Postgres e Mailcatcher, roda as migrations e depois o Next.js
pnpm test    # sobe os serviços, roda o Next.js e os testes, e depois derruba tudo
pnpm lint
```

Os emails enviados em desenvolvimento aparecem no Mailcatcher em http://localhost:1080.
