/**
 * @fileOverview Componente de Instalação Móvel v100.0
 * Gerencia o prompt de instalação PWA ou fornece instruções para iOS/Android.
 */
"use client";

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-12 gap-3 text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent transition-all rounded-lg px-3">
          <Smartphone size={16} />
          <span className="text-[11px] font-bold uppercase tracking-tight">Usar no Celular</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
            <Smartphone className="text-primary" /> LexisPredict Mobile
          </DialogTitle>
          <DialogDescription className="font-bold uppercase text-[10px]">
            Tenha o seu gabinete jurídico na palma da mão.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-6">
          {deferredPrompt ? (
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase leading-relaxed">Seu navegador suporta instalação direta.</p>
              <Button onClick={handleInstallClick} className="w-full h-14 bg-black text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">
                <Download size={18} className="mr-2 text-primary" /> Instalar Aplicativo Agora
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/10 space-y-3">
                <p className="text-[11px] font-black uppercase text-primary flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</span> iOS (iPhone/iPad)
                </p>
                <p className="text-[10px] font-bold uppercase leading-relaxed text-muted-foreground">
                  No Safari, toque no ícone de <span className="text-foreground">Compartilhar</span> (quadrado com seta) e selecione <span className="text-foreground">"Adicionar à Tela de Início"</span>.
                </p>
              </div>
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/10 space-y-3">
                <p className="text-[11px] font-black uppercase text-primary flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">2</span> Android (Chrome)
                </p>
                <p className="text-[10px] font-bold uppercase leading-relaxed text-muted-foreground">
                  Toque no menu <span className="text-foreground">⋮ (três pontos)</span> no canto superior e selecione <span className="text-foreground">"Instalar Aplicativo"</span> ou "Adicionar à Tela Inicial".
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 text-[9px] font-bold uppercase text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
            <Info size={14} className="shrink-0 text-primary" />
            <span>Após instalado, o LexisPredict funcionará como um app nativo, sem as barras do navegador.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
