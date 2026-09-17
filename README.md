# MailPilot AI

Security-first AI email assistant. It ingests Gmail messages, reconstructs threads, creates validated AI-assisted replies, applies an authoritative deterministic policy, and sends only approved/eligible drafts with idempotency and audit logging.

## Quick start

1. Copy `.env.example` to `.env` and replace all secrets.
2. `docker compose up -d postgres redis`
3. `npm install && npm run db:generate && npm run db:migrate`
4. `npm run dev`

Web: http://localhost:5173 · API: http://localhost:3000 · health: `/health`.

Production requires TLS at the reverse proxy, a managed PostgreSQL/Redis service, Google OAuth credentials, and a configured AI provider. The default global kill switch prevents auto-send.

## Verification

`npm run verify` and, with services/configuration available, `npm run test:e2e`.

See `ARCHITECTURE.md`, `SECURITY.md`, and `docs/OPERATIONS.md`.
