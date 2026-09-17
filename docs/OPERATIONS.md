# Operations

Run migrations before each deployment; deploy API/workers with graceful termination. Health probes: `/health` (process) and `/ready` (DB). Alert on send failures, blocked injection events, queue depth, auth anomalies and kill-switch changes. If Redis fails, API remains available but asynchronous actions return 503; persisted Gmail history allows replay after recovery. If PostgreSQL fails, readiness fails and no sends proceed. Gmail 401 triggers refresh; permanent OAuth errors disconnect the account and require review. A crash after Gmail accepts a send but before commit is reconciled by searching the unique RFC Message-ID before retrying.

## Release
`npm ci && npm run verify`; `npm run db:migrate`; deploy with TLS; verify kill switch on; connect a test Gmail account; sync one harmless thread; approve one draft; verify Gmail and audit; only then consider scoped auto-send.
