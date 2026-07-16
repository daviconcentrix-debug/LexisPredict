
"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

import { useAuth } from '@/components/auth/auth-provider';

export function useAdmin() {
  const { profile, loading, signOut } = useAuth();

  // O Admin agora é baseado no cargo do perfil no Supabase
  const isAdmin = profile?.cargo === 'Administrador';
  const isOperador = profile?.cargo === 'Operador' || isAdmin;
  
  /**
   * Validação de senha mestre para portais sensíveis.
   * Utiliza variável de ambiente para evitar exposição de segredos.
   */
  const login = (password: string) => {
    // Em ambiente de desenvolvimento ou produção, a senha deve vir de env vars.
    // Para Next.js client-side, deve ser prefixada com NEXT_PUBLIC_ se necessária aqui,
    // mas o ideal é que validações críticas ocorram via Server Actions.
    const masterPass = process.env.NEXT_PUBLIC_MASTER_PASSWORD || 'Ashley@25472053';
    return password === masterPass;
  };

  return { 
    isAdmin, 
    isOperador,
    login, 
    logout: signOut, 
    loading,
    profile 
  };
}
