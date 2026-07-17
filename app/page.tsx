/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  ShieldAlert, 
  RefreshCcw, 
  FileDown, 
  FileCheck,
  Copyright,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  TrendingDown,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  Target
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';
import { getTranslation, Locale } from '@/lib/i18n';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Tooltip
} from 'recharts';

export default function Dashboard() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<Locale>('pt');
  const [iaInsights, setIaInsights] = useState<any>(null);

  const t = getTranslation(locale);

  const loadInsights = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedInsights = localStorage.getItem('lexisPredict_notes_analysis');
    if (savedInsights) {
      try {
        const parsed = JSON.parse(savedInsights);
        setIaInsights(parsed);
      } catch (e) {
        setIaInsights(null);
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem('lexisPredict_locale') as Locale;
    if (savedLocale) setLocale(savedLocale);
    
    loadInsights();

    const handleStorageUpdate = (e: any) => loadInsights();
    window.addEventListener('lexis-insights-updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('lexis-insights-updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [loadInsights]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const caseData = await fetchRepoCases();
      if (Array.isArray(caseData)) {
        setCases(caseData);
      }
    } catch (error) {
      console.log('SYNC_FAIL');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  const metrics = useMemo(() => {
    const totalRepo = cases.length;
    const ativos = cases.filter(c => !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()));
    const activeDemands = ativos.length;
    
    const vencidos = cases.filter(c => c.status === 'Vencido' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const venceHoje = cases.filter(c => c.status === 'É Hoje' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const atencao = cases.filter(c => c.status === 'Atenção' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const noPrazo = cases.filter(c => c.status === 'No Prazo' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length; 
    const semPrazo = cases.filter(c => (c.status === 'Sem Prazo' || !c.proximoPrazo) && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    
    const finalizados = cases.filter(c => ['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()) || c.status === 'Arquivado' || c.status === 'Encerrado').length;

    const vencidosArray = cases.filter(c => c.status === 'Vencido' && c.diasFaltando !== null);
    const tempoMedio = vencidosArray.length > 0 
      ? Math.round(Math.abs(vencidosArray.reduce((acc, c) => acc + (c.diasFaltando || 0), 0)) / vencidosArray.length) 
      : 0;

    const riskSum = (vencidos * 1.0) + (venceHoje * 0.8) + (atencao * 0.5) + (noPrazo * 0.1);
    const riskScore = activeDemands > 0 ? Math.min(100, Math.round((riskSum / activeDemands) * 100)) : 0;

    const statusData = [
      { name: 'Vencidos', value: vencidos, color: '#ef4444' },
      { name: 'Hoje', value: venceHoje, color: '#3b82f6' },
      { name: 'Atenção', value: atencao, color: '#f97316' },
      { name: 'Saudáveis', value: noPrazo, color: '#22c55e' },
      { name: 'Sem Prazo', value: semPrazo, color: '#94a3b8' },
      { name: 'Finalizados', value: finalizados, color: '#1f2937' }
    ].filter(d => d.value > 0);

    return { totalRepo, activeDemands, vencidos, venceHoje, atencao, noPrazo, semPrazo, finalizados, tempoMedio, riskScore, statusData };
  }, [cases]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={18} className="text-primary" />
              <h1 className="font-bold text-sm tracking-[0.2em] uppercase">{t.controlPanel}</h1>
            </div>
            <Badge variant="outline" className="hidden xl:flex text-[9px] font-black border-primary/40 text-primary uppercase">Active Gabinete Node</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex border-border/50 hover:border-primary hover:bg-primary/10 text-xs font-semibold h-9 px-6 rounded-sm uppercase tracking-wider transition-all">
              <Link href="/report">
                <FileDown size={14} className="mr-2" /> Dossiê Operacional
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} className="h-9 w-9 text-muted-foreground hover:text-primary border border-transparent hover:border-border">
               <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-10">
          {/* SEÇÃO 1: MÉTRICAS DE URGÊNCIA */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Target size={16} className="text-red-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Métricas de Urgência em Tempo Real</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Vencem Hoje" value={loading ? "..." : metrics.venceHoje} icon={<Clock size={16} />} color={metrics.venceHoje > 0 ? "primary" : "primary"} />
              <StatCard title="Vencidos" value={loading ? "..." : metrics.vencidos} icon={<ShieldAlert size={16} />} color="destructive" />
              <StatCard title="Em Atenção" value={loading ? "..." : metrics.atencao} icon={<Calendar size={16} />} color="accent" />
              <StatCard title="Atraso Médio" value={loading ? "..." : `${metrics.tempoMedio} dias`} icon={<TrendingUp size={16} />} color="destructive" />
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-10">
               {/* SEÇÃO 2: SAÚDE DA CARTEIRA */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-card border border-border/50 rounded-md p-6 h-[400px] flex flex-col shadow-sm hover:border-primary/20 transition-all">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Status da Carteira (Ativos: {metrics.activeDemands})</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={metrics.statusData} innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                            {metrics.statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-6">
                       <StatusMiniPill color="bg-red-500" label="Vencidos" value={metrics.vencidos} />
                       <StatusMiniPill color="bg-orange-500" label="Atenção" value={metrics.atencao} />
                       <StatusMiniPill color="bg-green-500" label="Saudáveis" value={metrics.noPrazo} />
                    </div>
                  </section>

                  <section className="bg-card border border-border/50 rounded-md p-6 h-[400px] flex flex-col shadow-sm hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Parecer IA de Gabinete</h3>
                       <Badge variant="outline" className="text-[8px] border-primary/30 text-primary uppercase px-2">Elite Node</Badge>
                    </div>
                    {iaInsights ? (
                      <div className="space-y-5 overflow-auto flex-1 pr-2 custom-scrollbar">
                         {iaInsights.pontosFortes?.length > 0 ? (
                           <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-sm">
                              <p className="text-[8px] font-black text-green-500 uppercase flex items-center gap-1.5 mb-2.5 tracking-widest"><TrendingUp size={12}/> Pontos Fortes</p>
                              <ul className="space-y-2">
                                {iaInsights.pontosFortes.map((item: string, idx: number) => (
                                  <li key={idx} className="text-[10px] font-medium leading-relaxed opacity-80 uppercase">• {item}</li>
                                ))}
                              </ul>
                           </div>
                         ) : null}
                         {iaInsights.riscosDetectados?.length > 0 ? (
                           <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-sm">
                              <p className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1.5 mb-2.5 tracking-widest"><TrendingDown size={12}/> Riscos Detectados</p>
                              <ul className="space-y-2">
                                {iaInsights.riscosDetectados.map((item: string, idx: number) => (
                                  <li key={idx} className="text-[10px] font-medium leading-relaxed opacity-80 uppercase">• {item}</li>
                                ))}
                              </ul>
                           </div>
                         ) : null}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                         <div className="p-4 bg-secondary rounded-full">
                           <Sparkles size={32} />
                         </div>
                         <div>
                           <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma auditoria processada.</p>
                           <Link href="/notes" className="text-[9px] font-bold underline mt-2 uppercase text-primary">Ir para Evidências</Link>
                         </div>
                      </div>
                    )}
                  </section>
               </div>

               {/* SEÇÃO 3: OPERAÇÕES CRÍTICAS */}
               <section className="space-y-4">
                <div className="bg-card border border-border/50 rounded-md overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-border/10 bg-secondary/10 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <ShieldAlert size={14} className="text-red-500" />
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Prioridades Máximas</h3>
                     </div>
                     <Badge className="bg-red-500 text-white font-black text-[9px] uppercase px-3">{metrics.vencidos + metrics.venceHoje} ALERTA</Badge>
                  </div>
                  <div className="overflow-auto max-h-[400px] custom-scrollbar">
                    <table className="mission-control-table w-full">
                      <thead className="sticky top-0 bg-background border-b border-border/10">
                        <tr className="text-[8px] font-black uppercase text-muted-foreground">
                          <th className="p-4 text-left">Tribunal</th>
                          <th className="p-4 text-left">Cliente</th>
                          <th className="p-4 text-left">Protocolo</th>
                          <th className="p-4 text-right">Status de Atraso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases
                          .filter(c => ['Vencido', 'É Hoje', 'Atenção'].includes(c.status) && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()))
                          .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
                          .slice(0, 30)
                          .map((c) => (
                            <tr key={c.id} className="hover:bg-secondary/20 transition-colors border-b border-border/5 group">
                              <td className="p-4"><Badge variant="outline" className="text-[8px] font-black uppercase border-border/40 group-hover:border-primary/40">{c.tribunal}</Badge></td>
                              <td className="p-4 font-black uppercase text-[11px] truncate max-w-[200px]">{c.cliente}</td>
                              <td className="p-4 font-mono text-[9px] text-muted-foreground">{c.protocolo}</td>
                              <td className="p-4 text-right">
                                <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded-none border", (c.diasFaltando || 0) < 0 ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-orange-500 border-orange-500/20 bg-orange-500/5")}>
                                  {c.status === 'É Hoje' ? "É Hoje" : (c.diasFaltando || 0) < 0 ? `${Math.abs(c.diasFaltando || 0)}d atraso` : `Faltam ${c.diasFaltando}d`}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-8">
              <div className="bg-card border border-border/50 rounded-md p-8 space-y-6 shadow-sm hover:border-primary/20 transition-all">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Índice de Risco Global</p>
                   <span className={cn("text-3xl font-black tracking-tighter leading-none", metrics.riskScore > 80 ? "text-red-500" : metrics.riskScore > 40 ? "text-orange-500" : "text-primary")}>{metrics.riskScore}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-none overflow-hidden border border-border/10">
                   <div className={cn("h-full transition-all duration-1000", metrics.riskScore > 80 ? "bg-red-500" : metrics.riskScore > 40 ? "bg-orange-500" : "bg-primary")} style={{ width: `${metrics.riskScore}%` }} />
                </div>
                <div className="bg-secondary/20 p-4 border border-border/10 rounded-sm">
                  <p className="text-[9px] font-black uppercase text-center opacity-70 tracking-widest">
                    {metrics.riskScore > 80 ? "Status: Crítico" : metrics.riskScore > 60 ? "Status: Alto Risco" : metrics.riskScore > 40 ? "Status: Elevado" : "Status: Controlado"}
                  </p>
                </div>
              </div>

              <div className="bg-card border-2 border-border/50 rounded-md p-8 space-y-6 relative overflow-hidden group hover:border-primary/40 transition-all shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <FileCheck size={80} />
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="w-12 h-12 rounded-none bg-primary text-black flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#000]">
                    <FileCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Dossiê Operacional</h2>
                    <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed font-bold uppercase tracking-widest">
                      Geração de auditoria executiva completa para stakeholders e conselho jurídico.
                    </p>
                  </div>
                  <Button variant="default" asChild className="w-full bg-black text-white font-black h-12 rounded-none uppercase text-[10px] tracking-[0.2em] border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_rgba(0,0,0,0.1)] hover:shadow-none">
                    <Link href="/report">Gerar Relatório Master</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <footer className="h-10 border-t border-border/30 bg-background/80 backdrop-blur-md flex items-center justify-center gap-6 text-[9px] text-muted-foreground/50 font-black uppercase tracking-[0.3em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span>Advanced Monitoring • Davi Alves Figueredo</span>
        </footer>
      </main>
    </div>
  );
}

function StatusMiniPill({ color, label, value }: { color: string, label: string, value: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 bg-secondary/10 rounded-sm border border-border/5 hover:border-border/20 transition-all">
       <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">{label}</span>
       <span className="text-sm font-black">{value}</span>
    </div>
  );
}
