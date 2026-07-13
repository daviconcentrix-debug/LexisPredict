import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://segjskjlbeydlljnefai.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg'

export const isSupabaseConfigured = true

// Apenas para uso no CLIENT (componentes 'use client')
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

// Limpa sessão inválida automaticamente
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('lexis_')) {
          localStorage.removeItem(key);
        }
      });
    }
  });
}

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
