
import { createClient } from '@supabase/supabase-js';

/**
 * CLIENTE SUPABASE LEXISPREDICT - CONFIGURAÇÃO SaaS MULTI-TENANT
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://segjskjlbeydlljnefai.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg';

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder';

// Inicialização segura para garantir a conexão com o banco PostgreSQL e Auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'Administrador' | 'Operador' | 'Visualizador';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  empresa_id: string;
  nome: string;
  email: string;
  cargo: UserRole;
  role?: string; // Coluna adicional conforme dump do usuário: 'operador' | 'admin'
  created_at: string;
}

export interface Empresa {
  id: string;
  nome: string;
  created_at: string;
}
