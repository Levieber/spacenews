# spacenews

> 🇧🇷 [Leia em português](README.pt-BR.md)

My own version of [TabNews](https://www.tabnews.com.br), built while taking [curso.dev](https://curso.dev). The name is a Space vs Tab indentation joke.

**Live:** https://spacenews.levieber.com.br · **Status page:** https://spacenews.levieber.com.br/status

It's built backend-first: the API, the database and authentication come before the interface.

## What's in it

- **A versioned REST API** (`/api/v1`) on Next.js API routes: users, sessions, account activation, migrations and system status.
- **Sign-up with email activation:** a new account gets an activation token by email and can only log in after activating it.
- **Sessions** stored in PostgreSQL behind a cookie, with passwords hashed with bcrypt.
- **Feature-based authorization:** each user carries a list of features (`create:session`, `update:user:others`, `read:status:all`, …), and every route checks them, including whether a user may change another user's data.
- **SQL migrations** with `node-pg-migrate`, applied through the API itself (`/api/v1/migrations`).
- **A status page** showing the database version, connections and other health data.

## How it's tested

Integration tests run the real stack: Next.js, PostgreSQL and a Mailcatcher SMTP server, started with Docker Compose. Each API route and method has its own test file under `tests/integration/api/v1/`, plus an end-to-end test of the whole sign-up flow (register → activation email → activate → log in) and unit tests for the authorization rules.

CI runs on every pull request: the tests, plus format (oxfmt), code quality (oxlint), unused dependencies (knip) and Conventional Commits (commitlint).

## Stack

Next.js · React · PostgreSQL · node-pg-migrate · Nodemailer · Vitest · Docker Compose · GitHub Actions

## Running it

You need Node.js, pnpm and Docker.

```sh
pnpm install
pnpm dev     # starts Postgres and Mailcatcher, runs migrations, then Next.js
pnpm test    # starts the services, runs Next.js and the tests, then stops everything
pnpm lint
```

Emails sent in development show up in Mailcatcher at http://localhost:1080.
