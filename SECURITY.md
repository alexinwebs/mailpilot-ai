# Security model

Threats: cross-tenant access, credential theft, CSRF/XSS, replay/duplicate sends, malicious email prompt injection, malformed AI output, queue duplication and dependency outage. Controls: Argon2id passwords, signed short-lived JWT in HttpOnly SameSite=Lax cookies, origin checking, route schemas, rate limits, output encoding, AES-256-GCM token encryption, least-privilege Gmail scopes, unique provider IDs/send keys, transactional state guards, advisory send lock, global/user kill switches, explicit injection scoring, human review for risky/sensitive/legal/financial content, immutable audit events and redacted structured logs.

Deployment must terminate TLS, rotate secrets, restrict DB/Redis networks, encrypt backups, monitor auth/send failures, and set `AUTO_SEND_GLOBAL_KILL_SWITCH=true` until an operator completes a live canary. OAuth/AI secrets are never returned to clients.
