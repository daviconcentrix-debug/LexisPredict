
import { createClient } from '@supabase/supabase-js';

/**
 * CLIENTE SUPABASE LEXISPREDICT - CONFIGURAÇÃO RESILIENTE
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://segjskjlbeydlljnefai.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg';

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder';

// Inicialização segura para garantir a conexão com o banco PostgreSQL
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
