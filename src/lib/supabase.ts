
import { createClient } from '@supabase/supabase-js';

/**
 * CLIENTE SUPABASE LEXISPREDICT - CONFIGURAÇÃO SaaS MULTI-TENANT
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 * Nota: Todas as chaves devem ser configuradas no painel do Vercel.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== '' && 
  supabaseAnonKey &&
  supabaseAnonKey !== '';

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
