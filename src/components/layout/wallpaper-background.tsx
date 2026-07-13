'use client';

import { useEffect, useState, useCallback } from 'react';
import { browserStorage } from '@/lib/browser-storage';

/**
 * @fileOverview Camada de Atmosfera Orbital (v2.0)
 * Renderiza o wallpaper em uma camada dedicada para evitar erros de hidratação.
 */

export function WallpaperBackground() {
  const [url, setUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const fromLs = localStorage.getItem('lexisPredict_wallpaper') || 
                     localStorage.getItem('wallpaper');
      if (fromLs) {
        setUrl(fromLs);
        return;
      }

      const keys = ['main_wallpaper_blob', 'wallpaper', 'starlink-atmosphere'];
      for (const key of keys) {
        const asset = await browserStorage.getAsset(key);
        if (asset instanceof Blob) {
          setUrl(URL.createObjectURL(asset));
          return;
        }
        if (typeof asset === 'string' && asset.length > 0) {
          setUrl(asset);
          return;
        }
      }
      setUrl(null);
    } catch (e) {
      setUrl(null);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('lexis-wallpaper-changed', load);
    return () => window.removeEventListener('lexis-wallpaper-changed', load);
  }, [load]);

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
