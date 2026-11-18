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
