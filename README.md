# MailPilot AI

> A security-first, self-hosted, open-source AI email assistant for Gmail.

MailPilot AI synchronizes Gmail messages, reconstructs threads, detects whether a reply is needed, generates and critiques replies with an AI provider, applies deterministic safety policies, and routes replies through human review before sending.

The AI model never sends email directly. Sending is controlled by the application policy engine, review state, global kill switch, and idempotency safeguards.

## Features

- Gmail OAuth 2.0 connection
- Recurring Gmail synchronization
- Authenticated Gmail Pub/Sub push notifications with automatic watch renewal
- Email normalization and thread reconstruction
- AI-powered email classification
- Reply-required detection
- Prompt-injection detection
- Trusted knowledge/context retrieval
- Reply generation and critique
- Bounded reply refinement loop
- Deterministic automation policy engine
- Human review queue
- Save draft edits, Edit & Approve, Approve Original, and Reject actions
- Idempotent Gmail sending
- Duplicate-send protection
- Global send kill switch
- Encrypted OAuth refresh tokens
- Tenant-scoped API authorization
- Trusted-origin enforcement for every state-changing API request
- Gmail account ownership checks during OAuth
- Atomic review transitions and concurrent-send locks
- Gmail Message-ID reconciliation after ambiguous send failures
- Audit history and analytics
- Responsive React dashboard
- PostgreSQL persistence
- Redis and BullMQ background workers
- OpenAI-compatible, Anthropic, Groq, OpenRouter, and mock AI support

## Screens

MailPilot includes:

- Overview
- Inbox
- Review queue
- Automation policies
- Knowledge
- Analytics
- Audit logs
- Connected accounts
- Settings

## How it works

```text
Gmail
  ↓
Recurring synchronization
  ↓
Message normalization
  ↓
Thread reconstruction
  ↓
Prompt-injection detection
  ↓
AI classification
  ↓
Trusted context retrieval
  ↓
Reply generation
  ↓
AI critique and bounded refinement
  ↓
Deterministic policy engine
  ↓
Human review or block
  ↓
Approved Gmail send
  ↓
Audit log
```

The LLM can classify, generate, critique, and recommend. It cannot directly authorize an email send.

## Knowledge base

The Knowledge section provides trusted user context for email classification and reply generation.

Useful entries include:

- Your role, company, and professional background
- Products, services, pricing, and support policies
- Frequently asked questions
- Working hours and timezone
- Preferred writing style and email signature

### Current behavior

MailPilot loads up to eight enabled knowledge items belonging to the authenticated user. It selects the most recently updated entries and provides their titles and content to the configured AI provider.

The current version does not use semantic search, embeddings, or keyword relevance ranking. Tags are stored but are not currently used for retrieval.

Knowledge cannot override MailPilot's authorization checks, deterministic policy engine, human-review requirements, prompt-injection controls, or sending safeguards.

### Privacy

Do not store passwords, API keys, OAuth credentials, payment information, encryption keys, identity documents, or other highly sensitive information in Knowledge.

Knowledge content may be transmitted to the configured AI provider during email processing. Review that provider's privacy and retention policies before adding confidential information.

### Testing Knowledge

1. Add an entry describing your role or business.
2. Send a harmless email asking about that information.
3. Review the generated reply.
4. Confirm that it uses the stored information accurately.

## Technology

### Frontend

- React
- TypeScript
- Vite
- React Router
- Lucide icons

### Backend

- Node.js
- TypeScript
- Fastify
- Zod
- Prisma

### Infrastructure

- PostgreSQL
- Redis
- BullMQ
- Docker Compose

### AI providers

- OpenAI-compatible APIs
- GroqCloud
- OpenRouter
- OpenAI
- Anthropic
- Deterministic mock provider for local testing

## Requirements

- Node.js 24 or newer
- npm 11 or newer
- Docker
- Docker Compose
- Gmail account
- Google Cloud OAuth credentials
- An AI provider key, unless using mock mode

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/alexinwebs/mailpilot-ai.git
cd mailpilot-ai
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Create the environment file

```bash
cp .env.example .env
```

Generate local secrets:

```bash
openssl rand -hex 32
openssl rand -base64 32
```

Put the generated values in:

```env
JWT_SECRET=your-generated-hex-secret
ENCRYPTION_KEY=your-generated-base64-key
```

Never commit `.env`.

### 4. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
docker compose ps
```

Wait until PostgreSQL reports `healthy`.

### 5. Generate and migrate the database

```bash
npm run db:generate
npm run db:migrate
npm run db:validate
```

### 6. Build shared packages

```bash
npm run build -w @mailpilot/shared -w @mailpilot/config
```

### 7. Start the backend

```bash
set -a
source .env
set +a
npm run dev -w @mailpilot/backend
```

Verify:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

### 8. Start the frontend

In another terminal:

```bash
npm run dev -w @mailpilot/web
```

Open:

```text
http://localhost:5173
```

## Google OAuth configuration

1. Create a Google Cloud project.
2. Enable the Gmail API.
3. Configure the Google OAuth consent screen.
4. Add your Gmail account as a test user.
5. Add these scopes:

```text
openid
email
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.send
```

6. Create a Web application OAuth client.
7. Add the JavaScript origin:

```text
http://localhost:5173
```

8. Add the redirect URI:

```text
http://localhost:3000/v1/gmail/callback
```

9. Add the generated credentials to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/v1/gmail/callback
```

Restart the backend after changing `.env`.

## Free hosted AI with Groq

Create a Groq API key and configure:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-groq-api-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=openai/gpt-oss-20b
```

`AI_PROVIDER=openai` selects MailPilot's OpenAI-compatible transport. The actual provider is determined by `OPENAI_BASE_URL`.

Free plans have usage and rate limits. Each self-hosted user should provide their own API key.

## OpenAI configuration

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

## Anthropic configuration

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-sonnet-4-5
```

## Mock provider

For local UI and pipeline testing without an external AI service:

```env
NODE_ENV=development
AI_PROVIDER=mock
```

Mock mode is intentionally rejected in production.

## Sending safety

MailPilot starts with sending disabled:

```env
AUTO_SEND_GLOBAL_KILL_SWITCH=true
```

Keep this enabled while configuring and testing.

To test a controlled, human-approved send:

```env
AUTO_SEND_GLOBAL_KILL_SWITCH=false
```

Restart the backend after changing the value. Keep automatic sending disabled until the complete review flow has been tested using a dedicated Gmail account.

On Render, this variable lives in the service's Environment tab rather than a local `.env` file. Render redeploys apply the saved value immediately, and the variable does not reset itself between deploys — but treat `false` as a temporary, supervised state: enable it only to test one approved draft, confirm the send, then set it back to `true` and redeploy before leaving the service unattended.

## Verification

Run all primary checks:

```bash
set -a
source .env
set +a
npm run verify
```

Run browser E2E tests:

```bash
npm run test:e2e
```

Individual commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:validate
```

## Security

MailPilot includes:

- Argon2id password hashing
- Revocable authenticated sessions
- HttpOnly cookies
- Request rate limiting
- Zod request and AI-output validation
- AES-256-GCM OAuth token encryption
- Tenant-scoped database access
- Prompt-injection detection
- Trusted-origin request enforcement
- OAuth account takeover prevention
- Deterministic send authorization
- Global send kill switch
- Transactional send reservation and stale-lock recovery
- Stable per-draft-version Message-IDs
- Gmail reconciliation before retrying uncertain sends
- Unique send and provider-message identifiers
- Structured audit logging
- Secret and cookie log redaction

Email content is untrusted input. AI output is also untrusted until it passes runtime validation and deterministic policy checks.

When using a hosted AI provider, relevant email and knowledge context is sent to that provider. Review its privacy and data-retention policy before processing sensitive email.

See:

- [Architecture](ARCHITECTURE.md)
- [Security](SECURITY.md)
- [Testing](TESTING.md)
- [Operations](docs/OPERATIONS.md)
- [Gmail Pub/Sub](docs/GMAIL_PUBSUB.md)
- [Security audit](docs/SECURITY_AUDIT.md)

## Render deployment

MailPilot can run as a single-origin Render web service that serves the React dashboard, Fastify API, and BullMQ workers. The included `render.yaml` also provisions PostgreSQL and Render Key Value.

Follow the [Render deployment guide](docs/RENDER_DEPLOYMENT.md). Keep the global send kill switch enabled during the initial deployment, and use an always-on service for reliable email synchronization and queue processing.

This configuration has been verified on a live Render deployment, including real Gmail OAuth, real Gmail message ingestion, real Groq-generated drafts, human review, and a real approved Gmail send to an external inbox.

### Faster ingestion with Gmail Pub/Sub

By default, MailPilot polls Gmail on a fixed interval. Once deployed to a public HTTPS endpoint, it can optionally use [Gmail Pub/Sub push notifications](docs/GMAIL_PUBSUB.md) instead, which typically delivers new messages within a few seconds rather than waiting for the next poll.

This requires three variables to be set together:

```env
GMAIL_PUBSUB_TOPIC=projects/<project-id>/topics/<topic-name>
GMAIL_PUBSUB_AUDIENCE=https://<your-app>.onrender.com/v1/gmail/push
GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL=<push-service-account>@<project-id>.iam.gserviceaccount.com
```

Setup involves creating a Pub/Sub topic, granting Gmail's system service account (`gmail-api-push@system.gserviceaccount.com`) publish access, and creating an authenticated push subscription pointed at `/v1/gmail/push`. See the [Gmail Pub/Sub guide](docs/GMAIL_PUBSUB.md) for the full walkthrough.

Every push notification is verified against Google's signed OIDC identity token before it is trusted, and duplicate notifications are ignored using Gmail history IDs. If these three variables are left unset, MailPilot falls back to periodic polling automatically — no code changes are needed either way.

## Project status

MailPilot has been verified both locally and on a live Render deployment with:

- Real Gmail OAuth, including the production redirect URI
- Gmail synchronization via periodic polling and optional Pub/Sub push notifications
- Real Groq classification, explicit reply-required detection, and reply generation
- Human review, including Edit & Approve
- Real Gmail sending to an external inbox, confirmed end to end
- PostgreSQL and Redis (Render's free Key Value tier does not persist data; see the deployment guide)
- Type checking, linting, automated tests, builds, and schema validation, both locally and in the Render build

It is not yet presented as an unattended, multi-user production service. Before opening it to other users, it still needs persistent Redis, separated API and worker processes, monitoring and alerting, verified backups, Google OAuth verification for restricted scopes, and an independent security review. Keep the global send kill switch enabled by default, and only disable it briefly and deliberately to test a specific approved draft.

## Open-source model

MailPilot is designed for self-hosting and bring-your-own credentials:

- Users control their Gmail OAuth project.
- Users choose their AI provider.
- Users keep their credentials outside source control.
- No shared API key is included.
- The default policy is conservative.
- Automatic sending is opt-in.

Contributions, bug reports, documentation improvements, and security reviews are welcome.

## Contributing

1. Fork the repository.
2. Create a branch:

```bash
git checkout -b feature/your-feature
```

3. Make and verify your changes:

```bash
npm run verify
npm run test:e2e
```

4. Commit and push.
5. Open a pull request.

Never include credentials, personal email data, database dumps, or `.env` files in issues or pull requests.

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
