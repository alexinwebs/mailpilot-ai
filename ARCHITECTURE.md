# Architecture

npm-workspace monorepo: React/Vite web, Fastify API/worker, shared Zod contracts, PostgreSQL/Prisma, Redis/BullMQ. The API owns authentication, authorization, Gmail OAuth, review actions and reads. Workers own sync and AI pipelines. Gmail data is untrusted and is separated in prompts. AI structured outputs are runtime-validated. The policy service alone decides eligibility; the sending service rechecks current account/policy/kill-switch state under a database transaction and unique send key.

## Flow
Gmail OAuth → sync trigger (Pub/Sub push, verified via Google-signed OIDC identity, or periodic polling fallback) → sync queue → normalized message upsert → pipeline queue → deterministic scanning + explicit reply-required override + AI classification → knowledge lookup → draft/critique/refine (≤3) → policy decision → review, edit-and-approve, or send queue → locked Gmail send → audit.

## Deployment topology
The API, workers, and static frontend build run as a single Render web service behind one origin, backed by managed PostgreSQL and Render Key Value (non-persistent on the free tier). The `/v1/gmail/push` endpoint is the only publicly reachable inbound trigger besides the authenticated dashboard API; its trust boundary is Google's signed OIDC token, not session cookies.

## Boundaries
The browser receives no OAuth refresh tokens or AI keys. Every resource query is scoped with authenticated `userId`. PostgreSQL is authoritative; Redis jobs are delivery hints and therefore idempotent. External APIs use bounded timeouts/retries. See `docs/OPERATIONS.md` for failure handling.
