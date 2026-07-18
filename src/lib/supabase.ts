/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://segjskjlbeydlljnefai.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_placeholder';

export const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseAnonKey !== '' &&
  !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'Administrador' | 'Operador' | 'Visualizador';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  empresa_id: string;
  nome: string;
  email: string;
  cargo: UserRole;
  role?: string;
  created_at: string;
}

export interface Empresa {
  id: string;
  nome: string;
  created_at: string;
}
