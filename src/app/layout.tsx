
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'LexisPredict Elite SaaS',
  description: 'Gabinete Inteligente de Gestão Jurídica e Operações Forenses',
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
                
                const hexToHsl = (hex) => {
                  if (!hex || hex[0] !== '#') return null;
                  const cleanHex = hex.replace(/^#/, '');
                  let r = parseInt(cleanHex.length === 3 ? cleanHex[0]+cleanHex[0] : cleanHex.slice(0, 2), 16) / 255;
                  let g = parseInt(cleanHex.length === 3 ? cleanHex[1]+cleanHex[1] : cleanHex.slice(2, 4), 16) / 255;
                  let b = parseInt(cleanHex.length === 3 ? cleanHex[2]+cleanHex[2] : cleanHex.slice(4, 6), 16) / 255;
                  
                  let max = Math.max(r, g, b), min = Math.min(r, g, b);
                  let h = 0, s = 0, l = (max + min) / 2;
                  if (max === min) { h = 0; s = 0; }
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

                const getLuminance = (hex) => {
                  const cleanHex = hex.replace(/^#/, '');
                  const rgb = cleanHex.length === 3 
                    ? cleanHex.split('').map(x => parseInt(x + x, 16) / 255)
                    : cleanHex.match(/.{2}/g).map(x => parseInt(x, 16) / 255);
                  const res = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
                  return 0.2126 * res[0] + 0.7152 * res[1] + 0.0722 * res[2];
                };

                const getContrast = (hex1, hex2) => {
                  const l1 = getLuminance(hex1);
                  const l2 = getLuminance(hex2);
                  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
                };

                const bg = localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF';
                const bgSec = localStorage.getItem('lexisPredict_bg_secondary_color') || '#F3F4F6';
                const fontSaved = localStorage.getItem('lexisPredict_font_color');
                const btn = localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF';
                const borderSaved = localStorage.getItem('lexisPredict_border_color');
                const radius = localStorage.getItem('lexisPredict_border_radius') || '4';
                const wallpaper = localStorage.getItem('lexisPredict_wallpaper');
                const bgOpacity = localStorage.getItem('lexisPredict_bg_opacity') || '0.85';
                const sidebarOpacity = localStorage.getItem('lexisPredict_sidebar_opacity') || '0.9';
                const glassBlur = localStorage.getItem('lexisPredict_glass_blur') || '8';

                const lum = getLuminance(bg);
                
                // Protocolo de Contraste AAA
                let font = fontSaved || (lum > 0.45 ? '#000000' : '#FFFFFF');
                if (getContrast(bg, font) < 3.0) {
                  font = lum > 0.45 ? '#000000' : '#FFFFFF';
                }

                const fontMuted = lum > 0.45 ? '#4B5563' : '#9CA3AF';
                const border = borderSaved || (lum > 0.45 ? '#E5E7EB' : '#1F2937');

                const setHsl = (prop, hex) => {
                  const hsl = hexToHsl(hex);
                  if(hsl) root.style.setProperty(prop, hsl);
                };

                setHsl('--background', bg);
                setHsl('--card', bg);
                setHsl('--popover', bg);
                setHsl('--secondary', bgSec);
                setHsl('--foreground', font);
                setHsl('--muted-foreground', fontMuted);
                setHsl('--primary', btn);
                setHsl('--border', border);
                
                root.style.setProperty('--radius', radius + 'px');
                root.style.setProperty('--bg-opacity', bgOpacity);
                root.style.setProperty('--sidebar-opacity', sidebarOpacity);
                root.style.setProperty('--glass-blur', glassBlur + 'px');

                // Sidebar
                setHsl('--sidebar-background', bg);
                setHsl('--sidebar-foreground', font);
                setHsl('--sidebar-border', border);
                setHsl('--sidebar-primary', btn);

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
