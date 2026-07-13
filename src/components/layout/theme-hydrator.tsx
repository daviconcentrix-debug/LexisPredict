'use client';

import { useEffect, useState } from 'react';

/**
 * @fileOverview Gerenciador de Hidratação de Tema (v95000.0)
 * Resolve erros de Hydration Mismatch aplicando estilos dinâmicos baseados no localStorage
 * somente após a montagem do componente no cliente.
 */
export function ThemeHydrator() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    try {
      const wallpaper = localStorage.getItem('lexisPredict_wallpaper');
      const longReading = localStorage.getItem('lexis_long_reading') === 'true';
      const root = document.documentElement;

      // Aplica o papel de parede se existir
      if (wallpaper) {
        root.style.setProperty('--lexis-wallpaper', `url("${wallpaper}")`);
      } else {
        root.style.setProperty('--lexis-wallpaper', 'none');
      }

      // Aplica o modo de leitura (saturação) se ativo
      if (longReading) {
        root.classList.add('lexis-long-reading');
      } else {
        root.classList.remove('lexis-long-reading');
      }
    } catch (e) {
      console.warn('[ThemeHydrator] Falha ao sincronizar hardware visual.');
    }
  }, []);

  // Este componente não renderiza nada visual, apenas gerencia o estado do DOM global
  return null;
}
