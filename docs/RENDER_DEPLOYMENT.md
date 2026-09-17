# Render deployment

This deployment runs the Fastify API, BullMQ workers, and built React application in one Docker web service. Serving the UI and API from one origin avoids cross-site session-cookie complexity. PostgreSQL and Render Key Value remain separate managed services.

## Before deployment

1. Run `npm run verify` and `npm run test:e2e`.
2. Confirm `.env` is ignored and contains no tracked secrets.
3. Keep `AUTO_SEND_GLOBAL_KILL_SWITCH=true` during initial deployment.
4. Push `render.yaml` and the deployment changes to the default branch.

## Create the Blueprint

1. In Render, choose **New > Blueprint**.
2. Connect the MailPilot GitHub repository.
3. Render reads `render.yaml` and proposes:
   - `mailpilot-ai` web service
   - `mailpilot-postgres` PostgreSQL database
   - `mailpilot-redis` Key Value instance
4. Supply the prompted secret values:
   - `APP_URL`: the final HTTPS URL of the web service, with no trailing slash
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`: `APP_URL` followed by `/v1/gmail/callback`
   - `OPENAI_API_KEY`: the Groq API key when using the included Groq defaults

Render generates `JWT_SECRET` and `ENCRYPTION_KEY`. Do not replace those values after users or Gmail accounts have been created. Replacing `JWT_SECRET` invalidates sessions. Replacing `ENCRYPTION_KEY` makes stored OAuth credentials unreadable.

## Google OAuth

In the Google Cloud OAuth client, add the exact production redirect URI:

```text
https://YOUR-RENDER-SERVICE.onrender.com/v1/gmail/callback
```

Add the account used for the canary to the OAuth testing audience. Public use of Gmail restricted scopes can require Google verification and an independent security assessment.

## First canary

1. Confirm `/health` and `/ready` return successful responses.
2. Register a fresh MailPilot user.
3. Connect one dedicated test Gmail account.
4. Confirm incoming mail is synchronized.
5. Confirm the generated draft reaches human review.
6. Keep the global kill switch enabled while validating receive-only behavior.
7. Disable the kill switch only for one controlled manual **Edit & Approve** test.
8. Confirm exactly one message appears in Gmail Sent and exactly one reaches the recipient.
9. Re-enable the kill switch until operational monitoring is configured.

## Operational limitations

- The API and workers share one process in this deployment. Use exactly one web-service instance.
- A sleeping service does not poll Gmail or process BullMQ jobs. Reliable email automation requires an always-on Render plan.
- Fifteen-second Gmail polling is intended for testing. Gmail Pub/Sub should become the primary production trigger, with slower polling retained for recovery.
- Render free PostgreSQL and Key Value offerings are suitable only where their current retention, persistence, and availability limits are acceptable.
- Configure backups, alerts, log retention, and secret rotation before serving external users.