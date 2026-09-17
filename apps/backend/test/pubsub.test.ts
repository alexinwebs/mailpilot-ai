import { describe, expect, it } from 'vitest';
import { decodeGmailNotification } from '../src/email/pubsub.js';

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64');

describe('Gmail Pub/Sub payload parsing', () => {
  it('decodes a valid Gmail notification', () => {
    expect(
      decodeGmailNotification(
        encode({ emailAddress: 'user@example.com', historyId: '12345' }),
      ),
    ).toEqual({ emailAddress: 'user@example.com', historyId: '12345' });
  });

  it('rejects a malformed history identifier', () => {
    expect(() =>
      decodeGmailNotification(
        encode({ emailAddress: 'user@example.com', historyId: '../bad' }),
      ),
    ).toThrow();
  });

  it('rejects non-JSON data', () => {
    expect(() =>
      decodeGmailNotification(Buffer.from('not-json').toString('base64')),
    ).toThrow();
  });
});