# Architecture decisions

1. PostgreSQL is the source of truth; BullMQ is at-least-once, so consumers are idempotent.
2. Cookie JWT keeps the web simple; JWT contains only subject/session ID and is revocable through persisted sessions.
3. Gmail `gmail.modify` + `gmail.send` scopes avoid full mailbox scope.
4. AI providers share structured Zod contracts; deterministic provider exists only for tests/local opt-in.
5. Context retrieval uses tenant-scoped PostgreSQL text ranking initially; vector infrastructure is deferred.
6. Auto-send is deny-by-default and re-evaluated immediately before sending.
7. Gmail Pub/Sub push is additive, not required: it activates only when all three of `GMAIL_PUBSUB_TOPIC`, `GMAIL_PUBSUB_AUDIENCE`, and `GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL` are set together, and every push request is verified against Google's signed OIDC identity token before any payload is trusted. Periodic polling remains the fallback and the sole mechanism when Pub/Sub is unconfigured.
8. Render's free Key Value tier runs without persistence. This is an accepted short-term tradeoff for a low-cost demo deployment; queued jobs can be lost on a Redis restart, so this configuration is not treated as durable enough for unattended multi-user automation until persistence (or a managed Redis) is enabled.
9. Reply-required detection layers a deterministic, phrase-based override on top of AI classification rather than trusting the model alone, after observing the AI misclassify an explicit confirmation request as not requiring a reply. The AI remains the primary signal for messages without an explicit request.
