# Security model

Threats: cross-tenant access, credential theft, CSRF/XSS, replay/duplicate sends, malicious email prompt injection, malformed AI output, queue duplication and dependency outage. Controls: Argon2id passwords, signed short-lived JWT in HttpOnly SameSite=Lax cookies, origin checking, route schemas, rate limits, output encoding, AES-256-GCM token encryption, least-privilege Gmail scopes, unique provider IDs/send keys, transactional state guards, advisory send lock, global/user kill switches, explicit injection scoring, human review for risky/sensitive/legal/financial content, immutable audit events and redacted structured logs.

Deployment must terminate TLS, rotate secrets, restrict DB/Redis networks, encrypt backups, monitor auth/send failures, and set `AUTO_SEND_GLOBAL_KILL_SWITCH=true` until an operator completes a live canary. OAuth/AI secrets are never returned to clients.


## Hardened review and sending controls

- All browser state changes require the exact configured `APP_URL` origin in addition to SameSite cookies.
- Gmail OAuth refuses to transfer an already-connected provider account to a different MailPilot user.
- Approve, Edit & Approve, and Reject use conditional transactional state transitions so concurrent decisions cannot both succeed.
- Edited drafts increment their version, producing a new deterministic send key and RFC Message-ID.
- Send workers claim a database-backed lock before calling Gmail. A second worker cannot claim a fresh lock.
- Before retrying an uncertain send, MailPilot searches Gmail for its stable RFC Message-ID. If Gmail accepted the first request, the database is reconciled instead of sending again.
- Ambiguous failures remain `UNKNOWN` and are retried only after the lock becomes stale.

## Publication checklist

Before public deployment, terminate TLS, set secure cookies through `NODE_ENV=production`, use a managed secret store/KMS, restrict PostgreSQL and Redis to private networks, configure backups and alerts, verify Google OAuth, keep auto-send disabled during canaries, and commission an independent security review. Hosted AI providers receive relevant email content; operators must publish an accurate privacy policy and data-retention disclosure.
