# Delivery phases

- [x] 0 Discovery, repository and architecture
- [x] 1 Workspace/tooling foundation
- [x] 2 Shared contracts/configuration
- [x] 3 Relational schema and initial migration
- [x] 4 Authentication/session boundaries
- [x] 5 Gmail OAuth/client integration
- [x] 6 Ingestion and thread reconstruction
- [x] 7 AI abstraction, classification and injection defense
- [x] 8 Knowledge retrieval, generation, critique and bounded refinement
- [x] 9 Deterministic policy engine
- [x] 10 Review and idempotent sending services
- [x] 11 Queues/workers and failure semantics
- [x] 12 Dashboard and operational UI
- [x] 13 Audit, analytics and settings APIs
- [x] 14 Unit/API test suite and security checks
- [x] 15 Live PostgreSQL/Redis/Gmail integration canary (completed on Render with real Gmail OAuth, real synchronization, and real Groq inference; local dev-container credentials remain separately environment-blocked)
- [x] 16 Browser E2E verification
- [x] 17 Production deployment canary (deployed to Render; real Gmail message received, drafted, edited, approved, and sent to an external inbox; upstream Prisma CLI advisories remain documented and unresolved)
- [x] 18 Gmail Pub/Sub push ingestion (authenticated via Google-signed OIDC identity token; falls back to polling when unconfigured)

A phase is checked only where code and live verification exist. Multi-user production readiness (persistent Redis, separated worker process, monitoring, independent security review) remains open and is tracked outside this phase list.
