
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
       console.error("[AuthProvider] ❌ Supabase não configurado via ENV VARS.");
       setLoading(false);
       return null;
    }

    console.log(`[AuthProvider] 🚀 Buscando perfil de gabinete para UID: ${userId}`);
    
    try {
      // Prioridade 1: Buscar por auth_user_id (UUID oficial)
      let { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      // Prioridade 2: Busca resiliente por e-mail caso o UUID falhe
      if (!profileData || profileError) {
         console.warn("[AuthProvider] ⚠️ UUID não localizado no perfil, tentando via e-mail corporativo...");
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
        console.log("[AuthProvider] ✅ Perfil localizado. Entrada Liberada.");
        setProfile(profileData as UserProfile);
        
        // Garante cookie de identidade para as Server Actions
        if (profileData.email) {
           document.cookie = `lexis_user_email=${profileData.email.toLowerCase().trim()}; path=/; max-age=31536000; samesite=lax`;
        }
        return profileData as UserProfile;
      }
      
      console.warn("[AuthProvider] ❌ Nenhum perfil corporativo encontrado para este usuário.");
      return null;
    } catch (e) {
      console.error("[AuthProvider] 💥 Falha fatal no carregamento de perfil:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;

      console.log("[AuthProvider] 🔍 Analisando sessão local...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log(`[AuthProvider] 👤 Sessão detectada: ${session.user.email}`);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log("[AuthProvider] 🔒 Nenhuma sessão ativa.");
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (e) {
        console.error("[AuthProvider] ❌ Erro na inicialização de hardware:", e);
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
        
        // Limpeza de rastros de sessão
        document.cookie = "lexis_user_email=; path=/; max-age=0";

        if (!['/login', '/signup'].includes(pathname)) {
          window.location.href = '/login';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, profile]);

  const signOut = async () => {
    console.log("[AuthProvider] 🚪 Executando log-out oficial do gabinete...");
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
