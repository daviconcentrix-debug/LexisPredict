
"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

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
  const syncLockRef = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const loadProfile = async (userId: string) => {
    console.log(`[AuthProvider] Iniciando carga de perfil para: ${userId}`);
    
    try {
      // Prioridade 1: Buscar por auth_user_id (UUID)
      let { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      // Prioridade 2: Busca resiliente por e-mail se o UUID falhar
      if (!profileData || profileError) {
         console.warn("[AuthProvider] UUID não localizado, tentando via e-mail...");
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
        console.log("[AuthProvider] Perfil localizado com sucesso.");
        setProfile(profileData as UserProfile);
        
        // Sincroniza identidade com cookie para Server Actions
        if (profileData.email) {
           document.cookie = `lexis_user_email=${profileData.email}; path=/; max-age=31536000; samesite=lax`;
        }
        return profileData as UserProfile;
      }
      
      console.warn("[AuthProvider] Nenhum perfil de gabinete encontrado para este usuário.");
      return null;
    } catch (e) {
      console.error("[AuthProvider] Falha crítica ao carregar perfil:", e);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("[AuthProvider] Verificando sessão ativa...");
      try {
        const { data: { user: activeUser }, error } = await supabase.auth.getUser();
        
        if (activeUser) {
          console.log(`[AuthProvider] Sessão detectada para: ${activeUser.email}`);
          setUser(activeUser);
          await loadProfile(activeUser.id);
        } else {
          console.log("[AuthProvider] Nenhuma sessão ativa encontrada.");
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error("[AuthProvider] Erro na inicialização:", e);
      } finally {
        console.log("[AuthProvider] Finalizando estado de loading inicial.");
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] Evento de Auth: ${event}`);
      
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN' || !profile) {
          await loadProfile(session.user.id);
        }
        setLoading(false);
      } else {
        console.log("[AuthProvider] Usuário deslogado. Limpando estados...");
        setUser(null);
        setProfile(null);
        setLoading(false);
        
        // Limpar cookies de identidade
        document.cookie = "lexis_user_email=; path=/; max-age=0";
        document.cookie = "lexis_master_unlock=; path=/; max-age=0";

        if (!['/login', '/signup'].includes(pathname)) {
          router.push('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const signOut = async () => {
    console.log("[AuthProvider] Executando log-out...");
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
