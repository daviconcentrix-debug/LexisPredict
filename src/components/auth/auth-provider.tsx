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
  const loadingProfile = useRef(false);

  const loadProfile = async (userId: string) => {
    if (!isSupabaseConfigured || loadingProfile.current) return null;
    
    loadingProfile.current = true;
    console.log(`[AuthProvider] 🚀 Buscando perfil de gabinete para: ${userId}`);
    
    try {
      const { data: profileData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData as UserProfile);
        console.log("[AuthProvider] ✅ Perfil localizado com sucesso.");
        
        if (profileData.email) {
           document.cookie = `lexis_user_email=${profileData.email.toLowerCase().trim()}; path=/; max-age=31536000; samesite=lax`;
        }
        return profileData as UserProfile;
      }
      return null;
    } catch (e) {
      console.error("[AuthProvider] Profile Load Fail:", e);
      return null;
    } finally {
      loadingProfile.current = false;
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
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
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
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await loadProfile(session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        document.cookie = "lexis_user_email=; path=/; max-age=0";
        
        // Redirecionamento seguro para evitar loops no preview
        if (!['/login', '/signup'].includes(pathname)) {
          router.replace('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

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
