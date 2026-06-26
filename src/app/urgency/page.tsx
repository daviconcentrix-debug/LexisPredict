
"use client";

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, Copyright } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';

export default function UrgencyEngine() {
  const { isAdmin } = useAdmin();

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Motor de Prioridade</h1>
            <Badge className="bg-black text-white border-none font-black uppercase text-[10px]">Algoritmo Ativo</Badge>
            {!isAdmin && (
              <Badge variant="secondary" className="bg-[#e2e2e2] text-[10px] text-black font-black uppercase flex items-center gap-1.5 border border-black">
                <Lock size={10} /> MODO VISITANTE
              </Badge>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
          <section className="bg-white border border-black rounded-sm p-8 shadow-xl relative overflow-hidden group hover:bg-black transition-all cursor-default">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-white transition-all">
              <ShieldAlert size={120} />
            </div>
            <div className="relative z-10 space-y-4 max-w-2xl">
              <h2 className="text-2xl font-black text-black group-hover:text-white uppercase tracking-tight transition-colors">Pesos de Prioridade Automatizados</h2>
              <p className="text-black/60 group-hover:text-white/60 text-sm leading-relaxed font-black uppercase transition-colors">
                O núcleo técnico calcula automaticamente os níveis de urgência baseando-se na distância matemática entre o prazo e o dia atual. Calibre a sensibilidade abaixo.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UrgencyLevelCard icon={<ShieldAlert className="text-red-600" />} label="Vencido (Crítico)" condition="Data < Hoje" description="Prioridade máxima. Impacto direto na compliance jurídica." color="border-red-600" />
            <UrgencyLevelCard icon={<AlertTriangle className="text-orange-500" />} label="Atenção (Alerta)" condition="Dias ≤ 7" description="Ação imediata recomendada para revisão interna." color="border-orange-500" />
            <UrgencyLevelCard icon={<CheckCircle2 className="text-green-600" />} label="No Prazo (Saudável)" condition="Dias > 7" description="Monitoramento rotineiro mantido sem alertas." color="border-green-600" />
          </div>

          <Card className={cn("bg-white border-black shadow-sm rounded-sm overflow-hidden", !isAdmin && "opacity-50")}>
            <CardHeader className="bg-[#f8f9fb] border-b border-black">
              <CardTitle className="text-black font-black uppercase text-sm">Calibração do Motor</CardTitle>
              <CardDescription className="text-black/60 font-bold uppercase text-[10px]">
                {isAdmin ? "Ajuste os limites matemáticos para os alertas processuais." : "Acesso restrito a Administradores."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 py-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="text-black font-black uppercase text-xs">Limite de Alerta (Dias)</Label>
                  <span className="text-black font-black uppercase text-xs bg-[#f3f2f2] px-3 py-1 border border-black">7 Dias</span>
                </div>
                <Slider defaultValue={[7]} max={30} step={1} className="[&_[role=slider]]:bg-black" disabled={!isAdmin} />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="text-black font-black uppercase text-xs">Buffer Crítico (Dias)</Label>
                  <span className="text-red-600 font-black uppercase text-xs bg-red-50 px-3 py-1 border border-red-600">2 Dias</span>
                </div>
                <Slider defaultValue={[2]} max={10} step={1} className="[&_[role=slider]]:bg-red-600" disabled={!isAdmin} />
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 hover:text-black transition-colors cursor-default">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
          </div>
          <span className="w-1 h-1 bg-black rounded-full opacity-30" />
          <span className="text-black uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function UrgencyLevelCard({ icon, label, condition, description, color }: { icon: React.ReactNode, label: string, condition: string, description: string, color: string }) {
  return (
    <div className={cn("bg-white border p-6 rounded-sm space-y-3 hover:bg-black transition-all group cursor-default", color)}>
      <div className="icon-3d-wrapper w-fit">
        <div className="icon-3d-block white w-10 h-10 rounded-sm group-hover:bg-white border-black">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-black group-hover:text-white font-black text-sm uppercase transition-colors">{label}</h3>
        <p className="text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase tracking-widest mt-0.5">{condition}</p>
      </div>
      <p className="text-[10px] text-black/40 group-hover:text-white/40 font-black uppercase leading-relaxed transition-colors">{description}</p>
    </div>
  );
}
