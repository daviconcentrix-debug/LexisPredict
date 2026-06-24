
import { createClient } from '@supabase/supabase-js';

/**
 * CLIENTE SUPABASE LEXISPREDICT - CONFIGURAÇÃO RESILIENTE
 * Prioriza variáveis de ambiente do Vercel/Produção.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmfkrvpwnbllmzwqzjqt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg';

export const isSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder';

// Inicialização com fallback para evitar erros de build
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
