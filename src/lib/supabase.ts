import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase client that sends the user's access token, so table access is bound by RLS.
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// Stateless client for Supabase Auth calls (sign in, sign up, token refresh) made on the server.
export function createAuthClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export interface Template {
  id: string;
  title: string;
  medium: string;
  difficulty: string;
  duration: string;
  generated_image_id?: string;
  image_url?: string;
  source?: string;
  user_id: string | number;
  public?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TemplateInsert {
  title: string;
  medium: string;
  difficulty: string;
  duration: string;
  generated_image_id?: string;
  image_url?: string;
  source?: string;
  user_id: string | number;
  public?: boolean;
}

export interface UserProfile {
  id: string | number;
  email: string;
  first_name: string | null;
  username: string | null;
  favorite_medium: string | null;
  avatar_url?: string | null;
}

export const PROFILE_FIELDS = 'id, email, first_name, username, favorite_medium, avatar_url';

export interface SupabaseQueryResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number | null;
}
