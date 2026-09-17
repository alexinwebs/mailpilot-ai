# Testing strategy

Vitest covers schemas, message parsing, injection detection, policy matrices, bounded refinement, API auth, and duplicate prevention logic. Integration tests use Fastify injection; database integration requires `DATABASE_URL`. Playwright checks the built web shell and critical navigation. CI runs format check, lint, strict typecheck, tests, Prisma validation, builds and E2E. Live Gmail is verified by an operator canary because credentials and consent cannot be fabricated.
