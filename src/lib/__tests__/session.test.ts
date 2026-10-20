// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const getUser = vi.fn();
const refreshSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  PROFILE_FIELDS: 'id',
  createAuthClient: () => ({ auth: { getUser, refreshSession } }),
  createUserClient: vi.fn(() => ({})),
}));

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, requireUser, resolveSession } from '../auth/session';

function requestWithCookies(cookies: Record<string, string> = {}) {
  const cookieHeader = Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ');
  return new NextRequest('http://localhost/api/test', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

describe('session resolution', () => {
  beforeEach(() => {
    getUser.mockReset();
    refreshSession.mockReset();
  });

  it('returns 401 when there is no session cookie', async () => {
    const result = await requireUser(requestWithCookies());

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('returns 401 and clears cookies when the tokens are invalid', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    refreshSession.mockResolvedValue({ data: { session: null, user: null }, error: new Error('invalid') });

    const result = await requireUser(requestWithCookies({
      [ACCESS_TOKEN_COOKIE]: 'bad',
      [REFRESH_TOKEN_COOKIE]: 'bad',
    }));

    expect((result as Response).status).toBe(401);
    expect((result as Response).headers.get('set-cookie')).toContain(`${ACCESS_TOKEN_COOKIE}=;`);
  });

  it('resolves the user from a valid access token', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'auth-1' } }, error: null });

    const session = await resolveSession(requestWithCookies({ [ACCESS_TOKEN_COOKIE]: 'good' }));

    expect(getUser).toHaveBeenCalledWith('good');
    expect(session?.authUser.id).toBe('auth-1');
    expect(session?.refreshedSession).toBeNull();
  });

  it('refreshes an expired access token and writes the new cookies', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('expired') });
    refreshSession.mockResolvedValue({
      data: {
        user: { id: 'auth-1' },
        session: { access_token: 'new-access', refresh_token: 'new-refresh' },
      },
      error: null,
    });

    const result = await requireUser(requestWithCookies({
      [ACCESS_TOKEN_COOKIE]: 'expired',
      [REFRESH_TOKEN_COOKIE]: 'refresh',
    }));

    expect(result).not.toBeInstanceOf(Response);
    const context = result as Exclude<typeof result, Response>;
    expect(refreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh' });

    const response = context.respond(new (await import('next/server')).NextResponse(null));
    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toContain(`${ACCESS_TOKEN_COOKIE}=new-access`);
    expect(setCookie).toContain(`${REFRESH_TOKEN_COOKIE}=new-refresh`);
  });
});
