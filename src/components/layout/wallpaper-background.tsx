'use client';
/**
 * @fileOverview Camada de Atmosfera Orbital v1.0
 * Gerencia o carregamento resiliente do wallpaper sem Hydration Mismatch.
 */

import { useEffect, useState } from 'react';
import { browserStorage } from '@/lib/browser-storage';

export function WallpaperBackground() {
  const [url, setUrl] = useState<string | null>(null);

  const loadWallpaper = async () => {
    try {
      // 1. Prioridade: localStorage (URL direta ou Base64)
      const fromLs = localStorage.getItem('lexisPredict_wallpaper');
      if (fromLs) {
        setUrl(fromLs);
        return;
      }

      // 2. Fallback: IndexedDB (Blobs grandes)
      const keys = ['main_wallpaper_blob', 'wallpaper', 'starlink-atmosphere'];
      for (const key of keys) {
        const asset = await browserStorage.getAsset(key);
        if (asset instanceof Blob) {
          const objectUrl = URL.createObjectURL(asset);
          setUrl(objectUrl);
          return;
        }
        if (typeof asset === 'string' && asset) {
          setUrl(asset);
          return;
        }
      }
      
      setUrl(null);
    } catch (e) {
      console.error('[WallpaperBackground] Erro na sincronia visual:', e);
    }
  };

  useEffect(() => {
    loadWallpaper();

    // Ouvinte para atualizações em tempo real nas configurações
    window.addEventListener('lexis-wallpaper-changed', loadWallpaper);
    return () => window.removeEventListener('lexis-wallpaper-changed', loadWallpaper);
  }, []);

  // No primeiro render (SSR), retornamos null para ser idêntico ao server
  if (!url) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 w-full h-full"
      style={{
        backgroundImage: `url("${url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    />
  );
}
