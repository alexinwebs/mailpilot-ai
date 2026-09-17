# Architecture

npm-workspace monorepo: React/Vite web, Fastify API/worker, shared Zod contracts, PostgreSQL/Prisma, Redis/BullMQ. The API owns authentication, authorization, Gmail OAuth, review actions and reads. Workers own sync and AI pipelines. Gmail data is untrusted and is separated in prompts. AI structured outputs are runtime-validated. The policy service alone decides eligibility; the sending service rechecks current account/policy/kill-switch state under a database transaction and unique send key.

## Flow
Gmail OAuth → sync queue → normalized message upsert → pipeline queue → deterministic scanning + AI classification → knowledge lookup → draft/critique/refine (≤3) → policy decision → review or send queue → locked Gmail send → audit.

## Boundaries
The browser receives no OAuth refresh tokens or AI keys. Every resource query is scoped with authenticated `userId`. PostgreSQL is authoritative; Redis jobs are delivery hints and therefore idempotent. External APIs use bounded timeouts/retries. See `docs/OPERATIONS.md` for failure handling.
