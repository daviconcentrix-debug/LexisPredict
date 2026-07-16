
"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Copyright } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const logoAsset = PlaceHolderImages.find(img => img.id === 'app-logo');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Autenticação Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: cleanEmail, 
        password: password 
      });

      if (authError) {
        let errMsg = authError.message;
        if (errMsg === "Invalid login credentials") errMsg = "E-mail ou senha incorretos.";
        toast({ title: "Erro de Acesso", description: errMsg, variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!data.user) throw new Error("Usuário não retornado pelo servidor.");

      // 2. Busca de Perfil por auth_user_id (UUID) - Tentativa de resiliência
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('id, auth_user_id, empresa_id, cargo, email')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        // Se o perfil não for encontrado pelo UUID, tentamos pelo e-mail (caso de inconsistência pós-migração)
        const { data: profileByEmail } = await supabase
          .from('usuarios')
          .select('id, auth_user_id, empresa_id, cargo, email')
          .eq('email', cleanEmail)
          .maybeSingle();
        
        if (!profileByEmail) {
          toast({ 
            title: "Perfil Pendente", 
            description: "Acesso autorizado, mas o perfil de gabinete não foi localizado. Contate o administrador.", 
            variant: "destructive" 
          });
          setLoading(false);
          return;
        }
      }

      const finalProfile = profile || (await supabase.from('usuarios').select('*').eq('email', cleanEmail).maybeSingle()).data;

      // 3. Persistência de Identidade para Server Actions
      if (finalProfile) {
        document.cookie = `lexis_user_email=${finalProfile.email}; path=/; max-age=31536000; samesite=lax`;
      }

      toast({ title: "Acesso Autorizado", description: "Sincronizando ambiente de gabinete..." });
      
      // Forçamos o reload completo para garantir que o middleware e os cookies de sessão SSR sejam validados
      window.location.href = '/';
      
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({ 
        title: "Erro de Conexão", 
        description: "Falha na comunicação com o servidor de segurança.", 
        variant: "destructive" 
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f2f2] p-6 font-sans text-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="icon-3d-wrapper w-fit mx-auto">
            <div className="icon-3d-block black w-16 h-16 rounded-none border-2 border-black shadow-[10px_10px_0px_#000] overflow-hidden flex items-center justify-center p-2">
              {logoAsset && (
                <Image 
                  src={logoAsset.imageUrl} 
                  alt="Lexis Predict" 
                  width={48} 
                  height={48} 
                  data-ai-hint={logoAsset.imageHint}
                  className="object-contain invert"
                />
              )}
            </div>
          </div>
          <div className="group cursor-default">
            <h1 className="text-2xl font-black text-black uppercase tracking-tighter">LexisPredict Elite</h1>
            <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] opacity-60">W1 Capital Cloud CRM</p>
          </div>
        </div>

        <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
          <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-4">
            <CardTitle className="text-[10px] font-black uppercase text-black text-center tracking-widest">Autenticação de Gabinete</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-black">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-10 border-2 border-black h-12 text-black font-black uppercase text-xs bg-white focus-visible:ring-black placeholder:text-black/20 rounded-none" 
                    required 
                    placeholder="NOME@EMPRESA.COM"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-black">Senha de Segurança</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-10 border-2 border-black h-12 text-black font-black uppercase text-xs bg-white focus-visible:ring-black rounded-none" 
                    required 
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-black border-2 border-black font-black uppercase text-[10px] hover:bg-black hover:text-white transition-all shadow-[8px_8px_0px_#000] hover:shadow-none mt-4 rounded-none">
                {loading ? "Sincronizando..." : "Acessar Sistema"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-[#f8f9fb] border-t-2 border-black p-4 flex flex-col gap-2">
             <Link href="/signup" className="text-[9px] font-black text-black hover:bg-black hover:text-white px-2 py-2 transition-all uppercase text-center w-full rounded-none border-2 border-transparent hover:border-black">
                Solicitar Nova Instância SaaS
             </Link>
          </CardFooter>
        </Card>

        <footer className="text-center space-y-2 opacity-60">
           <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-black">
              <Copyright size={9} /> 2026 W1 Capital. Todos os direitos reservados.
           </div>
           <p className="text-[8px] text-black font-black uppercase tracking-tighter">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</p>
        </footer>
      </div>
    </div>
  );
}
