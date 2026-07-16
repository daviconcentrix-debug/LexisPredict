
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/whatsapp');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-background text-foreground font-sans">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-black uppercase tracking-widest">Recurso em Manutenção</h1>
        <p className="text-sm opacity-60 uppercase">Redirecionando para Terminal WhatsApp...</p>
      </div>
    </div>
  );
}
