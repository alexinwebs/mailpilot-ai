# Architecture decisions

1. PostgreSQL is the source of truth; BullMQ is at-least-once, so consumers are idempotent.
2. Cookie JWT keeps the web simple; JWT contains only subject/session ID and is revocable through persisted sessions.
3. Gmail `gmail.modify` + `gmail.send` scopes avoid full mailbox scope.
4. AI providers share structured Zod contracts; deterministic provider exists only for tests/local opt-in.
5. Context retrieval uses tenant-scoped PostgreSQL text ranking initially; vector infrastructure is deferred.
6. Auto-send is deny-by-default and re-evaluated immediately before sending.
