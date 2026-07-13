
import { createClient } from '@supabase/supabase-js';

/**
 * CLIENTE SUPABASE LEXISPREDICT - CONFIGURAÇÃO SaaS DEFINITIVA
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */
const supabaseUrl = 'https://segjskjlbeydlljnefai.supabase.co';
const supabaseAnonKey = 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg';

export const isSupabaseConfigured = true;

// Exportação única e centralizada para o banco de dados
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'Administrador' | 'Operador' | 'Visualizador';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  empresa_id: string;
  nome: string;
  email: string;
  cargo: UserRole;
  created_at: string;
}
