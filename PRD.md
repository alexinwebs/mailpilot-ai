# Product requirements

MailPilot AI reduces inbox work while keeping users in control. A user can authenticate, connect Gmail, synchronize mail, inspect reconstructed threads, review/edit/reject/approve drafts, manage knowledge and conservative automation policies, and inspect analytics/audit history. Replies are never sent directly by an LLM. MVP success means the complete review-based path is usable; auto-send remains opt-in, policy-gated, idempotent, rate-limited, auditable, and globally disableable.

## Functional acceptance
- Gmail OAuth with encrypted refresh-token storage and revocation/disconnect.
- Incremental Gmail ingestion with provider ID uniqueness and normalized thread/message records, triggered by Gmail Pub/Sub push where configured, with periodic polling as the fallback and recovery path.
- Validated classification, injection detection, context retrieval, generation, critique, max-three refinement.
- A deterministic reply-required override for messages containing explicit requests (e.g. "please confirm", "could you reply"), so AI misclassification cannot silently suppress a needed reply.
- `AUTO_SEND`, `HUMAN_REVIEW`, or `BLOCK` deterministic decision.
- Authenticated tenant-scoped APIs and responsive dashboard states.
- Transactional review/send state transitions, including edit-and-approve as a distinct reviewed action from unedited approval, and immutable audit records.

## Non-goals
No Exchange/IMAP, organization RBAC, autonomous attachment processing, or semantic vector database in this release.
