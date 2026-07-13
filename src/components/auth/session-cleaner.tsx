'use client';
/**
 * ESTE ARQUIVO FOI CRIADO PARA LIMPAR SESSÕES QUEBRADAS NO CLIENTE.
 * Execução real ocorre via useEffect no navegador para sanear o localStorage.
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function SessionCleaner() {
  const router = useRouter();

  useEffect(() => {
    async function checkAndCleanSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // Se der erro de refresh token ou sessão inválida
        if (error || !session) {
          console.warn('[SessionCleaner] Sessão inválida detectada. Limpando...');
          
          // Limpa tudo localmente
          await supabase.auth.signOut({ scope: 'local' });
          
          // Limpa localStorage relacionado ao Supabase e ao App
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

          // Se não estiver na página de login ou signup, força redirecionamento
          const path = window.location.pathname;
          if (!path.includes('/login') && !path.includes('/signup')) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('[SessionCleaner] Erro grave:', err);
        // Em caso de falha catastrófica, reseta o hardware de cache
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
