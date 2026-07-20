/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, UserProfile, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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
  
  // Travas de resiliência para evitar loops de re-render
  const initialized = useRef(false);
  const fetchingProfile = useRef(false);
  const lastUserId = useRef<string | null>(null);

  const loadProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    if (fetchingProfile.current && lastUserId.current === userId) return;
    
    fetchingProfile.current = true;
    lastUserId.current = userId;

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
        document.cookie = `lexis_user_email=${p.email.toLowerCase().trim()}; path=/; max-age=31536000; samesite=lax`;
      } else {
        // Fallback por e-mail se UUID falhar
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const { data: altProfile } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', authUser.email.toLowerCase().trim())
            .maybeSingle();
          
          if (altProfile) {
            setProfile(altProfile as UserProfile);
          }
        }
      }
    } catch (e) {
      console.error("[AuthProvider] Erro Crítico de Perfil:", e);
    } finally {
      fetchingProfile.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Sessão Inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Ouvinte de Mudanças (Listener)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] 📡 Evento Auth: ${event}`);
      
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        lastUserId.current = null;
        document.cookie = "lexis_user_email=; path=/; max-age=0";
        setLoading(false);
        router.replace('/login');
        return;
      }

      if (sessionUser) {
        if (lastUserId.current !== sessionUser.id) {
          setLoading(true);
          loadProfile(sessionUser.id);
        } else {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    lastUserId.current = null;
    document.cookie = "lexis_user_email=; path=/; max-age=0";
    setLoading(false);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
