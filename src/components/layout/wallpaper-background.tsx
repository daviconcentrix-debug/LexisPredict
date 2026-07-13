'use client'

import { useEffect, useState, useCallback } from 'react'
import { browserStorage } from '@/lib/browser-storage'

export function WallpaperBackground() {
  const [url, setUrl] = useState<string | null>(null)

  const load = useCallback(async () => {
    let objectUrl: string | null = null
    try {
      const fromLs =
        localStorage.getItem('lexisPredict_wallpaper') ||
        localStorage.getItem('wallpaper') ||
        localStorage.getItem('main_wallpaper_url')

      if (fromLs) {
        setUrl(fromLs)
        return
      }

      for (const key of [
        'main_wallpaper_blob',
        'side_wallpaper_blob',
        'wallpaper',
        'main_wallpaper',
      ]) {
        const asset = await browserStorage.getAsset(key)
        if (asset instanceof Blob) {
          objectUrl = URL.createObjectURL(asset)
          setUrl(objectUrl)
          return
        }
        if (typeof asset === 'string' && asset.length > 0) {
          setUrl(asset)
          return
        }
      }

      setUrl(null)
    } catch (e) {
      console.error('[WallpaperBackground]', e)
      setUrl(null)
    }
  }, [])

  useEffect(() => {
    load()
    const onChange = () => load()
    window.addEventListener('lexis-wallpaper-changed', onChange)
    return () => window.removeEventListener('lexis-wallpaper-changed', onChange)
  }, [load])

  // SSR + 1º render: null → sem hydration mismatch
  if (!url) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{
        zIndex: 0,
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    />
  )
}
