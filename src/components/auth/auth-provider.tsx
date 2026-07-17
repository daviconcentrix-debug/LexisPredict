/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, UserProfile, isSupabaseConfigured } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const initialized = useRef(false);

  const loadProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
       console.warn("[AuthProvider] Supabase não configurado.");
       setLoading(false);
       return null;
    }

    try {
      console.log(`[AuthProvider] 🚀 Buscando perfil de gabinete para: ${userId}`);
      
      // Prioridade 1: Buscar por auth_user_id (UUID oficial)
      let { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      // Prioridade 2: Busca resiliente por e-mail caso o UUID falhe
      if (!profileData || profileError) {
         console.log("[AuthProvider] 📡 UUID não localizado, tentando busca resiliente por e-mail...");
         const { data: { user: authUser } } = await supabase.auth.getUser();
         if (authUser?.email) {
           const { data: altProfile } = await supabase
             .from('usuarios')
             .select('*')
             .eq('email', authUser.email.toLowerCase().trim())
             .maybeSingle();
           profileData = altProfile;
         }
      }

      if (profileData) {
        console.log("[AuthProvider] ✅ Perfil localizado com sucesso.");
        setProfile(profileData as UserProfile);
        
        // Garante cookie de identidade para as Server Actions
        if (profileData.email) {
           document.cookie = `lexis_user_email=${profileData.email.toLowerCase().trim()}; path=/; max-age=31536000; samesite=lax`;
        }
        return profileData as UserProfile;
      }
      
      console.warn("[AuthProvider] ⚠️ Perfil não encontrado no banco de dados.");
      return null;
    } catch (e) {
      console.error("[AuthProvider] ❌ Falha crítica no carregamento do perfil:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;

      try {
        console.log("[AuthProvider] 🔍 Analisando sessão local...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log("[AuthProvider] 👤 Nenhuma sessão ativa detectada.");
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] 📡 Evento Global: ${event}`);
      
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN' || !profile) {
          await loadProfile(session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        
        document.cookie = "lexis_user_email=; path=/; max-age=0";

        if (!['/login', '/signup'].includes(pathname)) {
          console.log("[AuthProvider] 🚪 Sessão encerrada, redirecionando para login.");
          window.location.href = '/login';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, profile]);

  const signOut = async () => {
    console.log("[AuthProvider] 🔒 Iniciando encerramento de gabinete...");
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    document.cookie = "lexis_user_email=; path=/; max-age=0";
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
