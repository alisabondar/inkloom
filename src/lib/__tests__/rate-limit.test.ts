import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../rate-limit';

describe('createRateLimiter', () => {
  it('allows requests up to the limit, then blocks with a retry delay', () => {
    let time = 0;
    const check = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => time });

    expect(check('user-a').allowed).toBe(true);
    expect(check('user-a').allowed).toBe(true);

    time = 15_000;
    const blocked = check('user-a');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(45);
  });

  it('counts each key separately', () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0 });

    expect(check('user-a').allowed).toBe(true);
    expect(check('user-b').allowed).toBe(true);
    expect(check('user-a').allowed).toBe(false);
  });

  it('allows requests again once old ones leave the window', () => {
    let time = 0;
    const check = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => time });

    expect(check('user-a').allowed).toBe(true);
    time = 60_000;
    expect(check('user-a').allowed).toBe(true);
  });
});
