/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
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
  const router = useRouter();
  const initialized = useRef(false);
  const profileLoadingId = useRef<string | null>(null);
  const profileRef = useRef<UserProfile | null>(null);

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
        const p = profileData as UserProfile;
        setProfile(p);
        profileRef.current = p;
        document.cookie = `lexis_user_email=${p.email.toLowerCase().trim()}; path=/; max-age=31536000; samesite=lax`;
        return p;
      }
      
      // Fallback por email se UUID falhar
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        const { data: altProfile } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', authUser.email.toLowerCase().trim())
          .maybeSingle();
        
        if (altProfile) {
          const p = altProfile as UserProfile;
          setProfile(p);
          profileRef.current = p;
          return p;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] 📡 Evento: ${event}`);
      
      if (session?.user) {
        setUser(session.user);
        // Só carrega o perfil se ainda não o tivermos ou se for um evento explícito de SIGNED_IN
        if (!profileRef.current || event === 'SIGNED_IN') {
          await loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        profileRef.current = null;
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
    profileRef.current = null;
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