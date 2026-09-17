import { describe,expect,it } from 'vitest';
import { createSendIdentity,isSendLockStale } from '../src/services/send.js';

describe('send idempotency safety',()=>{
  it('creates a stable identity for one draft version',()=>{
    const first=createSendIdentity('draft-123',2);
    const second=createSendIdentity('draft-123',2);
    expect(first).toEqual(second);
    expect(first.sendKey).toHaveLength(64);
    expect(first.internetMessageId).toBe('<mailpilot-draft-123-2@mailpilot.local>');
  });

  it('changes identity when edited content increments the version',()=>{
    expect(createSendIdentity('draft-123',2).sendKey).not.toBe(createSendIdentity('draft-123',3).sendKey);
  });

  it('does not allow a fresh send lock to be reclaimed',()=>{
    const now=1_000_000;
    expect(isSendLockStale(new Date(now-29_999),now)).toBe(false);
    expect(isSendLockStale(new Date(now-30_000),now)).toBe(true);
  });
});