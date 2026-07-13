import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ThemeHydrator } from '@/components/layout/theme-hydrator'
import { WallpaperBackground } from '@/components/layout/wallpaper-background'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'W1 Capital | LexisPredict',
  description: 'Enterprise Legal Management Multi-Tenant',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Só cores/opacidade — NÃO setar backgroundImage aqui */}
        <Script id="theme-loader" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var root = document.documentElement;
                var bgOpacity = localStorage.getItem('lexisPredict_bg_opacity') || '0.85';
                var sidebarOpacity = localStorage.getItem('lexisPredict_sidebar_opacity') || '0.9';
                var glassBlur = localStorage.getItem('lexisPredict_glass_blur') || '8';
                root.style.setProperty('--bg-opacity', bgOpacity);
                root.style.setProperty('--sidebar-opacity', sidebarOpacity);
                root.style.setProperty('--glass-blur', glassBlur + 'px');

                function hexToHsl(hex) {
                  if (!hex || hex[0] !== '#') return null;
                  var r = parseInt(hex.slice(1, 3), 16) / 255;
                  var g = parseInt(hex.slice(3, 5), 16) / 255;
                  var b = parseInt(hex.slice(5, 7), 16) / 255;
                  var max = Math.max(r, g, b), min = Math.min(r, g, b);
                  var h = 0, s = 0, l = (max + min) / 2;
                  if (max !== min) {
                    var d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
                    else if (max === g) h = (b - r) / d + 2;
                    else h = (r - g) / d + 4;
                    h /= 6;
                  }
                  return Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%';
                }
                var bg = localStorage.getItem('lexisPredict_bg_color');
                var font = localStorage.getItem('lexisPredict_font_color');
                var btn = localStorage.getItem('lexisPredict_btn_bg_color');
                var radius = localStorage.getItem('lexisPredict_border_radius');
                if (bg) { var b = hexToHsl(bg); if (b) { root.style.setProperty('--background', b); root.style.setProperty('--card', b); } }
                if (font) { var f = hexToHsl(font); if (f) root.style.setProperty('--foreground', f); }
                if (btn) { var p = hexToHsl(btn); if (p) root.style.setProperty('--primary', p); }
                if (radius) root.style.setProperty('--radius', radius + 'px');
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body
        className="font-sans antialiased selection:bg-primary/20 min-h-screen"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeHydrator />
          <WallpaperBackground />
          <div className="relative z-10 min-h-screen">{children}</div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
