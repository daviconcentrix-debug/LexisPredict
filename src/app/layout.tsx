
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';

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
      </head>
      <body className="font-sans antialiased bg-[#f3f2f2] text-black selection:bg-black/20">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
