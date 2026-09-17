# Security upgrade instructions

This upgrade adds trusted-origin enforcement, OAuth account ownership protection, atomic review decisions, Edit & Approve, send locking, and Gmail Message-ID reconciliation.

## Apply

1. Back up the repository and database.
2. Apply `mailpilot-security-upgrade.patch` from the repository root with `patch -p1 < mailpilot-security-upgrade.patch`, or copy the complete upgraded source over the checkout. The archive does not contain `.env`.
3. Run `npm ci` and `npm run db:generate`.
4. Load `.env`, then run `npm run verify` and `npm run test:e2e`.
5. Restart backend and frontend. No database migration is required for this upgrade.

## Canary

Keep `AUTO_SEND_GLOBAL_KILL_SWITCH=true`. Create one new test message, verify the editable review card, and test Save Changes and Reject. For the send canary only, disable the kill switch while automation remains off, use Edit & Approve on one controlled draft, confirm the exact edited text arrived, confirm `SENT` and audit events, then re-enable the switch.

State-changing HTTP requests now require an `Origin` header exactly matching `APP_URL`. CLI calls to mutation endpoints must include `Origin: $APP_URL`.
