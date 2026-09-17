# Engineering rules

Strict TypeScript; no `any`, suppression directives, hardcoded secrets, swallowed failures, unbounded retries, or provider responses without Zod validation. Keep tenant authorization in repository/service queries. LLM output is advisory only. Make state transitions and send idempotency transactional. Log identifiers and outcomes, never credentials or full message bodies. Tests may use the deterministic mock AI provider; production cannot silently fall back to it unless explicitly configured.
