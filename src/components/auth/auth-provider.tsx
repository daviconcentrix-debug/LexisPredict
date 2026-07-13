
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
    // Semáforo de Sincronização: Impede execuções redundantes
    if (syncLockRef.current === userId && profile) return profile;
    syncLockRef.current = userId;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (profileError) return null;

      if (profileData) {
        setProfile(profileData as UserProfile);
        
        // Sincroniza identidade com cookie para Server Actions
        if (profileData.email) {
           document.cookie = `lexis_user_email=${profileData.email}; path=/; max-age=31536000; samesite=lax`;
        }
        return profileData as UserProfile;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (e) {
        // Silencioso em produção
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN' || !profile) {
          await loadProfile(session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
        syncLockRef.current = null;
        
        // Limpar cookies de identidade
        document.cookie = "lexis_user_email=; path=/; max-age=0";
        document.cookie = "lexis_master_email=; path=/; max-age=0";
        document.cookie = "lexis_master_unlock=; path=/; max-age=0";

        if (!['/login', '/signup'].includes(pathname)) {
          router.push('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    syncLockRef.current = null;
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
