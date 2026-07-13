
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/**
 * SENTINELA DE SESSÃO v2.0
 * Monitora a saúde do token e limpa o cache apenas em deslogue real.
 */
export function SessionCleaner() {
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se não houver sessão e não estivermos no login, redirecionamos.
        if (!session) {
          const path = window.location.pathname;
          if (!path.includes('/login') && !path.includes('/signup')) {
            console.warn('[SessionCleaner] Sessão ausente. Redirecionando...');
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('[SessionCleaner] Erro de validação:', err);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase.auth.token');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('lexis_')) {
            localStorage.removeItem(key);
          }
        });
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
