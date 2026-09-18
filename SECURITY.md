# Security model

Threats: cross-tenant access, credential theft, CSRF/XSS, replay/duplicate sends, spoofed or replayed Gmail push notifications, malicious email prompt injection, malformed AI output, queue duplication and dependency outage. Controls: Argon2id passwords, signed short-lived JWT in HttpOnly SameSite=Lax cookies, origin checking, route schemas, rate limits, output encoding, AES-256-GCM token encryption, least-privilege Gmail scopes, unique provider IDs/send keys, transactional state guards, advisory send lock, global/user kill switches, explicit injection scoring, human review for risky/sensitive/legal/financial content, immutable audit events and redacted structured logs.

Deployment must terminate TLS, rotate secrets, restrict DB/Redis networks, encrypt backups, monitor auth/send failures, and set `AUTO_SEND_GLOBAL_KILL_SWITCH=true` until an operator completes a live canary. OAuth/AI secrets are never returned to clients.


## Hardened review and sending controls

- All browser state changes require the exact configured `APP_URL` origin in addition to SameSite cookies.
- Gmail OAuth refuses to transfer an already-connected provider account to a different MailPilot user.
- Approve, Edit & Approve, and Reject use conditional transactional state transitions so concurrent decisions cannot both succeed.
- Edited drafts increment their version, producing a new deterministic send key and RFC Message-ID.
- Send workers claim a database-backed lock before calling Gmail. A second worker cannot claim a fresh lock.
- Before retrying an uncertain send, MailPilot searches Gmail for its stable RFC Message-ID. If Gmail accepted the first request, the database is reconciled instead of sending again.
- Ambiguous failures remain `UNKNOWN` and are retried only after the lock becomes stale.

## Gmail Pub/Sub push endpoint

`/v1/gmail/push` is a public HTTP endpoint that Google Cloud Pub/Sub calls directly; it cannot use session cookies or CSRF origin checks like the rest of the API. Its security relies entirely on the following controls, all enforced before any payload is trusted:

- Every request's `Authorization` bearer token is verified as a Google-signed OIDC identity token, not merely well-formed JSON.
- The token's audience must exactly match the configured `GMAIL_PUBSUB_AUDIENCE`.
- The token's `email` claim must exactly match the configured `GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL`, rejecting tokens signed by any other identity.
- The decoded Pub/Sub envelope and inner Gmail notification are both schema-validated; malformed or unexpected payloads are rejected with `400` before any processing occurs.
- Notifications for Gmail accounts MailPilot does not recognize are acknowledged without revealing whether that account exists, and without triggering any processing.
- Duplicate notifications are ignored using Gmail history IDs, so a redelivered or replayed Pub/Sub message cannot trigger duplicate synchronization.
- If `GMAIL_PUBSUB_TOPIC`, `GMAIL_PUBSUB_AUDIENCE`, and `GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL` are not all configured together, push ingestion stays inactive and MailPilot relies solely on periodic polling; there is no partially-configured state that accepts push traffic.

Operators self-hosting MailPilot should treat the push subscription's service account and audience as security-relevant configuration, not merely a performance optimization, since a misconfigured audience or an unverified endpoint would allow spoofed synchronization triggers.

## Publication checklist

Before public deployment, terminate TLS, set secure cookies through `NODE_ENV=production`, use a managed secret store/KMS, restrict PostgreSQL and Redis to private networks, enable Redis persistence (disabled by default on Render's free Key Value tier), configure backups and alerts, verify Google OAuth, keep auto-send disabled during canaries, and commission an independent security review. Hosted AI providers receive relevant email content; operators must publish an accurate privacy policy and data-retention disclosure.
