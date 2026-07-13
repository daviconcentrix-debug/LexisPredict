'use client';

import { useEffect } from 'react';

/**
 * @fileOverview Gerenciador de Hidratação de Tema (v3.0)
 * Sincroniza classes e variáveis CSS do localStorage de forma segura após o mount.
 */

function applyOpacityVars() {
  try {
    const root = document.documentElement;
    const bgOpacity = localStorage.getItem('lexisPredict_bg_opacity') || '0.85';
    const sidebarOpacity = localStorage.getItem('lexisPredict_sidebar_opacity') || '0.9';
    const glassBlur = localStorage.getItem('lexisPredict_glass_blur') || '8';

    root.style.setProperty('--bg-opacity', bgOpacity);
    root.style.setProperty('--sidebar-opacity', sidebarOpacity);
    root.style.setProperty('--glass-blur', `${glassBlur}px`);

    const longReading = localStorage.getItem('lexis_long_reading') === 'true';
    root.classList.toggle('lexis-long-reading', longReading);
  } catch (e) {}
}

export function ThemeHydrator() {
  useEffect(() => {
    applyOpacityVars();
    window.addEventListener('lexis-theme-changed', applyOpacityVars);
    return () => window.removeEventListener('lexis-theme-changed', applyOpacityVars);
  }, []);

  return null;
}
