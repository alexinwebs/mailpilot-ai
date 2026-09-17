import { describe, expect, it } from 'vitest';
import { hasExplicitReplyRequest } from '../src/email/reply-required.js';

describe('deterministic reply-required detection', () => {
  it('recognizes an explicit confirmation request', () => {
    expect(
      hasExplicitReplyRequest(
        'person@example.com',
        'Please confirm that you received this production test message.',
      ),
    ).toBe(true);
  });

  it('recognizes direct questions and polite requests', () => {
    expect(
      hasExplicitReplyRequest(
        'person@example.com',
        'Could you share your available times?',
      ),
    ).toBe(true);
  });

  it('does not override classification for automated senders', () => {
    expect(
      hasExplicitReplyRequest(
        'no-reply@example.com',
        'Please confirm your subscription.',
      ),
    ).toBe(false);
  });

  it('does not require a reply for an ordinary notification', () => {
    expect(
      hasExplicitReplyRequest(
        'updates@example.com',
        'Your monthly report is now available.',
      ),
    ).toBe(false);
  });
});