import type { Session } from '@supabase/supabase-js';
import { signInOrCreate } from './demo';

// Local-testing switch: with DEV_AUTH_BYPASS=true (and never in production) every request is
// signed in as one dev account. It is a real Supabase user, so RLS still applies as normal.
export function isDevAuthBypass() {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true';
}

const DEV_EMAIL = () => process.env.DEV_USER_EMAIL || 'dev@inkloom.test';
const DEV_PASSWORD = () => process.env.DEV_USER_PASSWORD || 'inkloom-dev-only-password';

let cached: Session | null = null;

export async function getDevSession(): Promise<Session> {
  const fresh = cached?.expires_at && cached.expires_at * 1000 - Date.now() > 60_000;
  if (cached && fresh) return cached;

  cached = await signInOrCreate(DEV_EMAIL(), DEV_PASSWORD(), { first_name: 'Dev', username: 'dev' });
  return cached;
}
