
"use client";

import { useAuth } from '@/components/auth/auth-provider';

export function useAdmin() {
  const { profile, loading, signOut } = useAuth();

  // O Admin agora é baseado no cargo do perfil no Supabase
  const isAdmin = profile?.cargo === 'Administrador';
  const isOperador = profile?.cargo === 'Operador' || isAdmin;
  
  // Mantendo a senha mestre apenas para o portal de código por compatibilidade de backup
  const login = (password: string) => {
    if (password === 'Ashley@25472053') {
      return true;
    }
    return false;
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
