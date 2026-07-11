import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'W1 Capital | Advanced Legal Ops',
  description: 'Gabinete Jurídico de Alta Performance',
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
                const theme = localStorage.getItem('lexisPredict_theme') || 'light';
                const bg = localStorage.getItem('lexisPredict_bg_color');
                const font = localStorage.getItem('lexisPredict_font_color');
                const btn = localStorage.getItem('lexisPredict_btn_bg_color');
                const radius = localStorage.getItem('lexisPredict_border_radius');
                const wallpaper = localStorage.getItem('lexisPredict_wallpaper');

                document.documentElement.classList.add('theme-' + theme);

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
                if (bg) root.style.setProperty('--background', hexToHsl(bg));
                if (font) root.style.setProperty('--foreground', hexToHsl(font));
                if (btn) root.style.setProperty('--primary', hexToHsl(btn));
                if (radius) root.style.setProperty('--radius', radius + 'px');
                if (wallpaper) {
                  root.style.backgroundImage = \`url(\${wallpaper})\`;
                  root.style.backgroundSize = 'cover';
                  root.style.backgroundAttachment = 'fixed';
                }
              } catch (e) {}
            })()
          `}
        </Script>
      </head>
      <body className="font-sans antialiased bg-background text-foreground transition-all duration-300">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}