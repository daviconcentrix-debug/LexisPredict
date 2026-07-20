/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, UserProfile, isSupabaseConfigured } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';

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
  const router = useRouter();
  const initialized = useRef(false);
  const profileLoadingId = useRef<string | null>(null);

  const loadProfile = async (userId: string) => {
    if (!isSupabaseConfigured || profileLoadingId.current === userId) return null;
    
    profileLoadingId.current = userId;
    try {
      console.log(`[AuthProvider] 🚀 Buscando perfil para: ${userId}`);
      
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
        document.cookie = `lexis_user_email=${profileData.email.toLowerCase().trim()}; path=/; max-age=31536000; samesite=lax`;
        return profileData as UserProfile;
      }
      
      // Fallback por email se UUID falhar (migração)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        const { data: altProfile } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', authUser.email.toLowerCase().trim())
          .maybeSingle();
        
        if (altProfile) {
          setProfile(altProfile as UserProfile);
          return altProfile as UserProfile;
        }
      }

      return null;
    } catch (e) {
      console.error("[AuthProvider] Erro ao carregar perfil:", e);
      return null;
    } finally {
      profileLoadingId.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    setup();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] 📡 Evento: ${event}`);
      
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
        if (!['/login', '/signup'].includes(window.location.pathname)) {
          router.replace('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    document.cookie = "lexis_user_email=; path=/; max-age=0";
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
