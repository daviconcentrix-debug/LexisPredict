/**
 * @fileOverview LexisPredict - W1 Capital Advanced Legal Operations
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 * @see LICENSE file for full terms.
 */

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'W1 Capital | LexisPredict Elite SaaS',
  description: 'Enterprise Legal Management & Risk Analysis Multi-Tenant - Fundador Davi Alves Figueredo',
  icons: {
    icon: 'https://picsum.photos/seed/lexislogo/32/32',
    apple: 'https://picsum.photos/seed/lexislogo/180/180',
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
                const root = document.documentElement;
                const bg = localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF';
                const bgSec = localStorage.getItem('lexisPredict_bg_secondary_color') || '#F3F4F6';
                const font = localStorage.getItem('lexisPredict_font_color') || '#0A0A0A';
                const fontMuted = localStorage.getItem('lexisPredict_font_muted_color') || '#6B7280';
                const btn = localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF';
                const btnInactive = localStorage.getItem('lexisPredict_btn_inactive_color') || '#E5E7EB';
                const radius = localStorage.getItem('lexisPredict_border_radius') || '4';
                const wallpaper = localStorage.getItem('lexisPredict_wallpaper');
                const bgOpacity = localStorage.getItem('lexisPredict_bg_opacity') || '0.85';
                const sidebarOpacity = localStorage.getItem('lexisPredict_sidebar_opacity') || '0.9';
                const glassBlur = localStorage.getItem('lexisPredict_glass_blur') || '8';

                const hexToHsl = (hex) => {
                  if (!hex || hex[0] !== '#') return null;
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
                  return Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%';
                };

                const setHsl = (prop, hex) => {
                  const hsl = hexToHsl(hex);
                  if(hsl) root.style.setProperty(prop, hsl);
                };

                setHsl('--background', bg);
                setHsl('--card', bg);
                setHsl('--secondary', bgSec);
                setHsl('--foreground', font);
                setHsl('--muted-foreground', fontMuted);
                setHsl('--primary', btn);
                setHsl('--accent', btnInactive);
                
                root.style.setProperty('--radius', radius + 'px');
                root.style.setProperty('--bg-opacity', bgOpacity);
                root.style.setProperty('--sidebar-opacity', sidebarOpacity);
                root.style.setProperty('--glass-blur', glassBlur + 'px');

                if (wallpaper) {
                  root.style.backgroundImage = 'url(' + wallpaper + ')';
                  root.style.backgroundSize = 'cover';
                  root.style.backgroundAttachment = 'fixed';
                }
              } catch (e) {}
            })()
          `}
        </Script>
      </head>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-300 min-h-screen">
        <AuthProvider>
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
