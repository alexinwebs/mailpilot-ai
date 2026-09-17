# Product requirements

MailPilot AI reduces inbox work while keeping users in control. A user can authenticate, connect Gmail, synchronize mail, inspect reconstructed threads, review/edit/reject/approve drafts, manage knowledge and conservative automation policies, and inspect analytics/audit history. Replies are never sent directly by an LLM. MVP success means the complete review-based path is usable; auto-send remains opt-in, policy-gated, idempotent, rate-limited, auditable, and globally disableable.

## Functional acceptance
- Gmail OAuth with encrypted refresh-token storage and revocation/disconnect.
- Incremental Gmail ingestion with provider ID uniqueness and normalized thread/message records.
- Validated classification, injection detection, context retrieval, generation, critique, max-three refinement.
- `AUTO_SEND`, `HUMAN_REVIEW`, or `BLOCK` deterministic decision.
- Authenticated tenant-scoped APIs and responsive dashboard states.
- Transactional review/send state transitions and immutable audit records.

## Non-goals
No Exchange/IMAP, organization RBAC, autonomous attachment processing, or semantic vector database in this release.
