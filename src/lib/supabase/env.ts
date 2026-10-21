export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const ACCESS_TOKEN_COOKIE = 'inkloom-access-token';
export const REFRESH_TOKEN_COOKIE = 'inkloom-refresh-token';
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_COOKIE_MAX_AGE,
};
