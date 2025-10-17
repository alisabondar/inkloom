import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface User {
  id: string
  email: string
  first_name: string
  favorite_medium: string
  created_at: string
}

export interface Template {
  id: string
  user_id: string
  title: string
  medium: string  // Required: no longer nullable
  difficulty: string  // Required: no longer nullable
  duration: string  // Required: no longer nullable
  generated_image_id: string
  image_url: string
  source: string
  created_at: string
  updated_at: string
}

export type TemplateInsert = Omit<Template, 'id' | 'created_at' | 'updated_at'>

export type SupabaseQueryResponse<T> = {
  data: T | null
  error: Error | null
  count: number | null
}
