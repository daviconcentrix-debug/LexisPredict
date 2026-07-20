
"use client";

/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Copyright, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const logoAsset = PlaceHolderImages.find(img => img.id === 'app-logo');

  // Protocolo de Ingresso Automático: Evita loop de tela de transição
  useEffect(() => {
    if (!authLoading && user && profile && !redirecting) {
      setRedirecting(true);
      router.push('/');
    }
  }, [user, profile, authLoading, router, redirecting]);

  if (!authLoading && user && profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f2f2] space-y-8 font-sans p-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-black text-white border-2 border-black flex items-center justify-center shadow-[12px_12px_0px_#00D1FF]">
          <ShieldCheck size={40} className="text-[#00D1FF]" />
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Sessão Ativa Detectada</h1>
          <div className="bg-white border-2 border-black p-4 inline-block">
             <p className="text-[10px] font-black text-black uppercase tracking-[0.3em]">{profile.nome}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="animate-spin text-black" size={32} />
           <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Sincronizando Cabinet Mission Control...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || redirecting) return;
    
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: cleanEmail, 
        password: password 
      });

      if (authError) {
        toast({ title: "Erro de Acesso", description: "E-mail ou senha incorretos.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (data.user) {
        setRedirecting(true);
        window.location.href = '/';
      }
      
    } catch (error: any) {
      toast({ title: "Falha na Sincronia", description: "Erro de comunicação com o servidor.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f2f2] p-6 font-sans text-black overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none overflow-hidden">
        <div className="text-[25rem] font-black absolute -top-40 -left-20">LEXIS</div>
        <div className="text-[25rem] font-black absolute -bottom-40 -right-20">PREDICT</div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-6">
          <div className="icon-3d-wrapper w-fit mx-auto">
            <div className="icon-3d-block black w-20 h-20 rounded-none border-2 border-black shadow-[12px_12px_0px_#00D1FF] overflow-hidden flex items-center justify-center p-3">
              {logoAsset && (
                <Image 
                  src={logoAsset.imageUrl} 
                  alt="Lexis Predict" 
                  width={64} 
                  height={64} 
                  data-ai-hint={logoAsset.imageHint}
                  className="object-contain invert"
                />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-black uppercase tracking-tighter">LexisPredict Elite</h1>
            <p className="text-[11px] font-black text-black uppercase tracking-[0.4em] opacity-60">W1 Capital • Advanced Legal Ops</p>
          </div>
        </div>

        <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-6">
            <CardTitle className="text-[10px] font-black uppercase text-black text-center tracking-[0.3em]">Autenticação de Gabinete</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-black tracking-widest">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-10 border-2 border-black h-12 text-black font-black uppercase text-xs bg-white focus-visible:ring-black placeholder:text-black/20 rounded-none" 
                    required 
                    autoComplete="email"
                    placeholder="USUARIO@W1CAPITAL.COM"
                    disabled={loading || redirecting || authLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-black tracking-widest">Senha de Segurança</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-10 border-2 border-black h-12 text-black font-black uppercase text-xs bg-white focus-visible:ring-black rounded-none" 
                    required 
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={loading || redirecting || authLoading}
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading || redirecting || authLoading} className="w-full h-14 bg-black text-white border-2 border-black font-black uppercase text-[11px] tracking-widest hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_#00D1FF] hover:shadow-none mt-4 rounded-none">
                {loading || redirecting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Sincronizando Gabinete...</span>
                  </div>
                ) : "Acessar Sistema"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-[#f8f9fb] border-t-2 border-black p-6 flex flex-col gap-3">
             <Link href="/signup" className="text-[9px] font-black text-black/60 hover:text-black transition-all uppercase text-center w-full tracking-widest">
                Solicitar Nova Instância SaaS
             </Link>
          </CardFooter>
        </Card>

        <footer className="text-center space-y-4 opacity-60">
           <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black">
              <Copyright size={10} /> 2026 W1 Capital.
           </div>
           <p className="text-[8px] text-black font-black uppercase tracking-[0.3em]">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</p>
        </footer>
      </div>
    </div>
  );
}
