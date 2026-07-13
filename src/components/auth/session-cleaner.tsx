'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function SessionCleaner() {
  const router = useRouter();

  useEffect(() => {
    async function checkAndCleanSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.warn('[SessionCleaner] Sessão inválida detectada. Limpando...');
          
          await supabase.auth.signOut({ scope: 'local' });
          
          Object.keys(localStorage).forEach(key => {
            if (
              key.startsWith('sb-') ||
              key.includes('supabase') ||
              key.includes('lexis_') ||
              key === 'supabase.auth.token'
            ) {
              localStorage.removeItem(key);
            }
          });

          const path = window.location.pathname;
          if (!path.includes('/login') && !path.includes('/signup')) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('[SessionCleaner] Erro grave:', err);
        localStorage.clear();
      }
    }

    checkAndCleanSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        console.log('[SessionCleaner] Deslogado com sucesso, cache limpo.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
