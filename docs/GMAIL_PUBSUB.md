# Gmail Pub/Sub push notifications

MailPilot supports authenticated Google Cloud Pub/Sub push notifications as the primary Gmail synchronization trigger. Five-minute polling remains as recovery.

## Security model

- The push endpoint is `POST /v1/gmail/push`.
- Browser-origin enforcement is bypassed only for this endpoint.
- Every push request must contain a Google-signed OIDC bearer token.
- MailPilot validates the configured audience and exact service-account email.
- Notification payloads are runtime validated.
- Queue job IDs include the account and Gmail history ID to deduplicate repeated notifications.
- Notifications for unknown accounts are acknowledged without revealing account existence.

## Google Cloud setup

Use the same Google Cloud project as the Gmail OAuth client.

1. Enable the Gmail API and Pub/Sub API.
2. Create a topic, for example `mailpilot-gmail`.
3. Grant `gmail-api-push@system.gserviceaccount.com` the **Pub/Sub Publisher** role on that topic.
4. Create a dedicated service account for authenticated push delivery, for example `mailpilot-pubsub-push`.
5. Grant the Pub/Sub service agent permission to mint identity tokens for that service account as required by Google Cloud.
6. Create a push subscription:
   - Endpoint: `https://YOUR_DOMAIN/v1/gmail/push`
   - Enable authenticated push
   - Select the dedicated push service account
   - Audience: the exact endpoint URL
7. Configure MailPilot:

```text
GMAIL_PUBSUB_TOPIC=projects/YOUR_PROJECT_ID/topics/mailpilot-gmail
GMAIL_PUBSUB_AUDIENCE=https://YOUR_DOMAIN/v1/gmail/push
GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL=mailpilot-pubsub-push@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

All three values must be present together. They are identifiers, not private keys.

## Activating watches

New Gmail connections schedule watch activation automatically when Pub/Sub is configured. Existing accounts can schedule activation with:

```text
POST /v1/gmail/accounts/:accountId/watch
```

This endpoint requires a valid MailPilot session and trusted browser origin. MailPilot renews watches expiring within 24 hours using a six-hour BullMQ scheduler. Gmail watches expire and must not be treated as permanent.

## Verification

1. Keep the global send kill switch enabled.
2. Activate the watch for one test account.
3. Send a new message from another account.
4. Confirm the `GMAIL_PUSH_RECEIVED` audit event.
5. Confirm the message reaches the Inbox and Review Queue.
6. Send a duplicate Pub/Sub notification and confirm only one processing job is created.
7. Confirm unsigned and wrong-audience requests receive `401`, and wrong service-account identities receive `403`.

Free Render web services can sleep. A push request wakes the service but can still incur a cold-start delay. Reliable low-latency processing requires an always-on service and persistent Key Value storage.