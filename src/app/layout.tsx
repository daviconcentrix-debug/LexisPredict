import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeHydrator } from '@/components/layout/theme-hydrator';
import { WallpaperBackground } from '@/components/layout/wallpaper-background';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'W1 Capital | LexisPredict Elite SaaS',
  description: 'Enterprise Legal Management & Risk Analysis Multi-Tenant',
  icons: {
    icon: 'https://picsum.photos/seed/lexislogo/32/32',
  },
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
                const bg = localStorage.getItem('lexisPredict_bg_color');
                const font = localStorage.getItem('lexisPredict_font_color');
                const btn = localStorage.getItem('lexisPredict_btn_bg_color');
                const radius = localStorage.getItem('lexisPredict_border_radius');
                const bgOpacity = localStorage.getItem('lexisPredict_bg_opacity') || '1';
                const sidebarOpacity = localStorage.getItem('lexisPredict_sidebar_opacity') || '1';
                const glassBlur = localStorage.getItem('lexisPredict_glass_blur') || '0';

                const hexToHsl = (hex) => {
                  if (!hex) return null;
                  let r = parseInt(hex.slice(1, 3), 16) / 255;
                  let g = parseInt(hex.slice(3, 5), 16) / 255;
                  let b = parseInt(hex.slice(5, 7), 16) / 255;
                  let max = Math.max(r, g, b), min = Math.min(r, g, b);
                  let h, s, l = (max + min) / 2;
                  if (max === min) h = s = 0;
                  else {
                    let d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                      case g: h = (b - r) / d + 2; break;
                      case b: h = (r - g) / d + 4; break;
                    }
                    h /= 6;
                  }
                  return \`\${Math.round(h * 360)} \${Math.round(s * 100)}% \${Math.round(l * 100)}%\`;
                };

                const root = document.documentElement;

                if (bg) {
                  const hsl = hexToHsl(bg);
                  root.style.setProperty('--background', hsl);
                  root.style.setProperty('--card', hsl);
                }
                if (font) {
                  const hsl = hexToHsl(font);
                  root.style.setProperty('--foreground', hsl);
                }
                if (btn) {
                  const hsl = hexToHsl(btn);
                  root.style.setProperty('--primary', hsl);
                }
                if (radius) root.style.setProperty('--radius', radius + 'px');
                
                root.style.setProperty('--bg-opacity', bgOpacity);
                root.style.setProperty('--sidebar-opacity', sidebarOpacity);
                root.style.setProperty('--glass-blur', glassBlur + 'px');
              } catch (e) {}
            })()
          `}
        </Script>
      </head>
      <body className="font-sans antialiased selection:bg-primary/20 transition-all duration-300 bg-black min-h-screen" suppressHydrationWarning>
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
