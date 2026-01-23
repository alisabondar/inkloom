import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface Template {
  id: string;
  title: string;
  medium: string;
  difficulty: string;
  duration: string;
  generated_image_id?: string;
  image_url?: string;
  source?: string;
  user_id: string;
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
  user_id: string;
}

export interface SupabaseQueryResponse<T> {
  data: T | null;
  error: any;
  count?: number | null;
}

