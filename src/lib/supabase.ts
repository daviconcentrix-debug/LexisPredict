import { createClient as createBrowserClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://segjskjlbeydlljnefai.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg'

export const isSupabaseConfigured = true

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'Administrador' | 'Operador' | 'Visualizador'

export interface UserProfile {
  id: string
  auth_user_id: string
  empresa_id: string
  nome: string
  email: string
  cargo: UserRole
  created_at: string
}
