import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../admin', () => ({ getAdminClient: vi.fn() }));
vi.mock('../server', () => ({ createAuthClient: vi.fn() }));

import { getDemoAccount, isDemoEnabled, isDemoUser } from '../demo';

describe('guest demo account', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('is off unless both the email and the password are set', () => {
    vi.stubEnv('DEMO_USER_EMAIL', 'guest@example.com');
    vi.stubEnv('DEMO_USER_PASSWORD', '');
    expect(isDemoEnabled()).toBe(false);
    expect(getDemoAccount()).toBeNull();

    vi.stubEnv('DEMO_USER_PASSWORD', 'secret');
    expect(isDemoEnabled()).toBe(true);
  });

  it('recognises only the guest account, ignoring email case', () => {
    vi.stubEnv('DEMO_USER_EMAIL', 'Guest@Example.com');
    vi.stubEnv('DEMO_USER_PASSWORD', 'secret');
    expect(isDemoUser({ email: 'guest@example.com' })).toBe(true);
    expect(isDemoUser({ email: 'someone@example.com' })).toBe(false);
    expect(isDemoUser(null)).toBe(false);
  });

  it('treats nobody as the guest when the demo is off', () => {
    vi.stubEnv('DEMO_USER_EMAIL', '');
    vi.stubEnv('DEMO_USER_PASSWORD', '');
    expect(isDemoUser({ email: '' })).toBe(false);
  });
});

describe('guestLimits', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('defaults to 8 concepts per visitor and 80 for all guests an hour', async () => {
    const { guestLimits } = await import('../demo');
    expect(guestLimits()).toEqual({ perVisitor: 8, allGuests: 80 });
  });

  it('reads both limits from the environment', async () => {
    vi.stubEnv('GUEST_RATE_LIMIT_PER_HOUR', '12');
    vi.stubEnv('GUEST_TOTAL_RATE_LIMIT_PER_HOUR', '200');
    const { guestLimits } = await import('../demo');
    expect(guestLimits()).toEqual({ perVisitor: 12, allGuests: 200 });
  });
});

