import type { Session, User } from '@supabase/supabase-js';
import { getAdminClient } from './admin';
import { createAuthClient } from './server';

// The guest demo: one shared, confirmed account that visitors can try the app with, without
// signing up. It is on only when DEMO_USER_EMAIL and DEMO_USER_PASSWORD are set (the password
// never leaves the server). Guests can create and edit templates, but can't change the account
// itself or publish to the public gallery.
export function getDemoAccount() {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  return email && password ? { email, password } : null;
}

export const isDemoEnabled = () => getDemoAccount() !== null;

export function isDemoUser(user: Pick<User, 'email'> | null | undefined) {
  const demo = getDemoAccount();
  return Boolean(demo && user?.email && user.email.toLowerCase() === demo.email.toLowerCase());
}

export const GUEST_LOCKED = "The guest account can't change this. Create your own account to do that.";

/** Signs in with a password, creating the confirmed account on first use. */
export async function signInOrCreate(email: string, password: string, metadata: Record<string, string>): Promise<Session> {
  const authClient = createAuthClient();
  let { data, error } = await authClient.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    // First run: create the account (the profile row comes from the signup trigger).
    await getAdminClient().auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
    ({ data, error } = await authClient.auth.signInWithPassword({ email, password }));
  }

  if (error || !data.session) throw new Error(`Could not sign in ${email}: ${error?.message ?? 'no session'}`);
  return data.session;
}

export async function getDemoSession(): Promise<Session | null> {
  const demo = getDemoAccount();
  if (!demo) return null;
  return signInOrCreate(demo.email, demo.password, { first_name: 'Guest', username: 'guest' });
}

/**
 * Everyone who tries the guest demo shares one account, so its hourly limit is split per visitor:
 * each browser gets its own allowance (a random id in a cookie), and all guests together get a
 * larger cap so a busy day can't spend the whole free AI allowance.
 */
export const GUEST_VISITOR_COOKIE = 'inkloom_guest_visitor';

const positive = (value: string | undefined, fallback: number) => {
  const n = parseInt(value || '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function guestLimits() {
  return {
    perVisitor: positive(process.env.GUEST_RATE_LIMIT_PER_HOUR, 8),
    allGuests: positive(process.env.GUEST_TOTAL_RATE_LIMIT_PER_HOUR, 80),
  };
}

