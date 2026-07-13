import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeHydrator } from '@/components/layout/theme-hydrator';
import { WallpaperBackground } from '@/components/layout/wallpaper-background';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'W1 Capital | LexisPredict Elite',
  description: 'Enterprise Legal Management & Risk Analysis Multi-Tenant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <Script id="theme-loader" strategy="beforeInteractive">
          {`
            (function() {
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
                  var h, s, l = (max + min) / 2;
                  if (max === min) h = s = 0;
                  else {
                    var d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                      case g: h = (b - r) / d + 2; break;
                      case b: h = (r - g) / d + 4; break;
                    }
                    h /= 6;
                  }
                  return Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%';
                }

                var bg = localStorage.getItem('lexisPredict_bg_color');
                var font = localStorage.getItem('lexisPredict_font_color');
                var btn = localStorage.getItem('lexisPredict_btn_bg_color');
                var radius = localStorage.getItem('lexisPredict_border_radius');

                if (bg) {
                  var hsl = hexToHsl(bg);
                  if (hsl) { root.style.setProperty('--background', hsl); root.style.setProperty('--card', hsl); }
                }
                if (font) {
                  var fHsl = hexToHsl(font);
                  if (fHsl) root.style.setProperty('--foreground', fHsl);
                }
                if (btn) {
                  var bHsl = hexToHsl(btn);
                  if (bHsl) root.style.setProperty('--primary', bHsl);
                }
                if (radius) root.style.setProperty('--radius', radius + 'px');
              } catch (e) {}
            })()
          `}
        </Script>
      </head>
      <body className="font-sans antialiased bg-transparent min-h-screen relative" suppressHydrationWarning>
        <AuthProvider>
          <ThemeHydrator />
          <WallpaperBackground />
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
