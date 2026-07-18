
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
  Copyright,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  TrendingDown,
  Sparkles,
  LayoutDashboard,
  Target,
  ArrowRight,
  History,
  Activity
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
        setIaInsights(JSON.parse(savedInsights));
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

    const handleStorageUpdate = () => loadInsights();
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  const metrics = useMemo(() => {
    const ativos = cases.filter(c => !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()));
    const activeDemands = ativos.length;
    
    const vencidos = cases.filter(c => c.status === 'Vencido' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const venceHoje = cases.filter(c => c.status === 'É Hoje' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const atencao = cases.filter(c => c.status === 'Atenção' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const noPrazo = cases.filter(c => c.status === 'No Prazo' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length; 
    
    const riskSum = (vencidos * 1.0) + (venceHoje * 0.8) + (atencao * 0.5) + (noPrazo * 0.1);
    const riskScore = activeDemands > 0 ? Math.min(100, Math.round((riskSum / activeDemands) * 100)) : 0;

    const statusData = [
      { name: 'Críticos', value: vencidos, color: '#ef4444' },
      { name: 'Hoje', value: venceHoje, color: '#3b82f6' },
      { name: 'Alerta', value: atencao, color: '#f97316' },
      { name: 'Saudáveis', value: noPrazo, color: '#10b981' }
    ].filter(d => d.value > 0);

    return { activeDemands, vencidos, venceHoje, atencao, noPrazo, riskScore, statusData };
  }, [cases]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-border/50 bg-white/60 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-40">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} className="text-black" />
              <h1 className="font-black text-xl tracking-tight uppercase text-foreground">Mission Control</h1>
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Gabinete Estratégico • W1 Capital</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="premium-card h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-wider border-none">
              <Link href="/report">
                <FileDown size={16} className="mr-2" /> Gerar Dossiê
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} className="h-10 w-10 rounded-xl hover:bg-secondary">
               <RefreshCcw size={18} className={cn(loading && "animate-spin text-primary")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 space-y-10 max-w-[1600px] mx-auto w-full">
          {/* TOP TELEMETRY */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Vencem Hoje" value={loading ? "..." : metrics.venceHoje} icon={<Clock />} color={metrics.venceHoje > 0 ? "warning" : "primary"} trend="14%" trendUp={false} />
            <StatCard title="Casos Vencidos" value={loading ? "..." : metrics.vencidos} icon={<ShieldAlert />} color="destructive" trend="2%" trendUp={false} />
            <StatCard title="Em Atenção" value={loading ? "..." : metrics.atencao} icon={<Calendar />} color="warning" trend="5%" trendUp={true} />
            <StatCard title="Total Ativos" value={loading ? "..." : metrics.activeDemands} icon={<History />} color="accent" trend="12%" trendUp={true} />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-10">
            <div className="xl:col-span-8 space-y-8">
               {/* NEURAL BRIEFING */}
               <section className="premium-card p-8 relative overflow-hidden group bg-white">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                    <Sparkles size={140} />
                  </div>
                  <div className="flex items-center justify-between mb-8 border-b border-border/30 pb-4">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl shadow-lg">
                         <Zap size={24} className="text-primary" />
                       </div>
                       <div>
                         <h3 className="font-black text-lg uppercase tracking-tight leading-none">Briefing Neural Diário</h3>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">Inteligência Operacional • Unidade Neural</p>
                       </div>
                    </div>
                    <Badge variant="outline" className="bg-secondary/50 border-none text-[10px] font-black uppercase px-3 py-1.5 rounded-full">Status: Sincronizado</Badge>
                  </div>

                  {iaInsights ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <p className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-2 tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full"><TrendingUp size={14}/> Vantagens Técnicas</p>
                          <ul className="space-y-4">
                            {iaInsights.pontosFortes?.slice(0, 4).map((item: string, idx: number) => (
                              <li key={idx} className="text-[12px] font-bold leading-relaxed text-foreground/80 uppercase flex gap-4">
                                <span className="text-emerald-500 font-black shrink-0">0{idx+1}</span> {item}
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="space-y-6">
                          <p className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 tracking-widest bg-red-50 w-fit px-3 py-1 rounded-full"><TrendingDown size={14}/> Riscos Detectados</p>
                          <ul className="space-y-4">
                            {iaInsights.riscosDetectados?.slice(0, 4).map((item: string, idx: number) => (
                              <li key={idx} className="text-[12px] font-bold leading-relaxed text-foreground/80 uppercase flex gap-4">
                                <span className="text-red-500 font-black shrink-0">!</span> {item}
                              </li>
                            ))}
                          </ul>
                       </div>
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-border/20 rounded-2xl bg-gray-50/50">
                       <Sparkles size={40} className="text-muted-foreground/20" />
                       <div className="space-y-1">
                          <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Nenhuma auditoria processada.</p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">Realize triagem em Evidências para gerar o briefing.</p>
                       </div>
                       <Button variant="link" asChild className="text-[11px] font-black uppercase underline p-0 h-auto text-primary">
                         <Link href="/notes">Processar Evidências Agora</Link>
                       </Button>
                    </div>
                  )}
               </section>

               {/* PRIORITY QUEUE */}
               <section className="premium-card overflow-hidden bg-white">
                  <div className="px-8 py-6 border-b border-border/30 flex items-center justify-between bg-secondary/10">
                     <div className="flex items-center gap-3">
                       <Target size={18} className="text-red-500" />
                       <h3 className="text-[11px] font-black uppercase tracking-[0.25em]">Fila de Prioridade Máxima</h3>
                     </div>
                     <Link href="/cases" className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
                       Painel de Casos <ArrowRight size={14} />
                     </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white border-b border-border/30">
                        <tr className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                          <th className="px-8 py-4">Tribunal</th>
                          <th className="px-8 py-4">Titular</th>
                          <th className="px-8 py-4">Deadline</th>
                          <th className="px-8 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {cases
                          .filter(c => ['Vencido', 'É Hoje', 'Atenção'].includes(c.status) && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()))
                          .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
                          .slice(0, 8)
                          .map((c) => (
                            <tr key={c.id} className="hover:bg-secondary/20 transition-colors group">
                              <td className="px-8 py-5">
                                <Badge variant="outline" className="text-[9px] font-black uppercase border-border/50 rounded-lg h-7 px-3 bg-white">{c.tribunal}</Badge>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-col">
                                  <span className="font-bold uppercase text-[12px] text-foreground group-hover:text-primary transition-colors">{c.cliente}</span>
                                  <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{c.protocolo}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                   <Clock size={12} className="text-muted-foreground" />
                                   <span className="text-[11px] font-black text-foreground tabular-nums uppercase">{c.proximoPrazo}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <span className={cn(
                                  "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                                  c.status === 'Vencido' ? "bg-red-100 text-red-700" : 
                                  c.status === 'É Hoje' ? "bg-blue-100 text-blue-700" : 
                                  "bg-orange-100 text-orange-700"
                                )}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
               </section>
            </div>

            <div className="xl:col-span-4 space-y-8">
               {/* RISK INDEX */}
               <section className="premium-card p-8 space-y-8 bg-white">
                  <div className="flex justify-between items-end">
                     <div className="space-y-1">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Risk Index</p>
                       <h4 className="text-5xl font-black tracking-tighter leading-none">{metrics.riskScore}%</h4>
                     </div>
                     <div className={cn(
                       "px-3 py-1.5 text-[10px] font-black uppercase rounded-lg shadow-sm border",
                       metrics.riskScore > 60 ? "bg-red-50 text-red-700 border-red-100" : metrics.riskScore > 30 ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                     )}>
                       {metrics.riskScore > 60 ? "Crítico" : metrics.riskScore > 30 ? "Alerta" : "Estável"}
                     </div>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                    <div className={cn("h-full transition-all duration-1000", metrics.riskScore > 60 ? "bg-red-500" : metrics.riskScore > 30 ? "bg-orange-500" : "bg-emerald-500")} style={{ width: `${metrics.riskScore}%` }} />
                  </div>
               </section>

               {/* HEALTH CHART */}
               <section className="premium-card p-8 h-[440px] flex flex-col bg-white">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-10">Status da Carteira</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.statusData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                          {metrics.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/30">
                     {metrics.statusData.map((item) => (
                       <div key={item.name} className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-[10px] font-black uppercase text-muted-foreground truncate">{item.name}</span>
                         <span className="text-[11px] font-black ml-auto tabular-nums">{item.value}</span>
                       </div>
                     ))}
                  </div>
               </section>

               {/* QUICK EXPORT */}
               <section className="bg-black text-white p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                    <Activity size={80} />
                  </div>
                  <div className="space-y-2 relative">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Relatório Consolidado</h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed opacity-60">Gere agora o dossiê executivo completo com toda a telemetria do gabinete.</p>
                  </div>
                  <Button variant="outline" asChild className="w-full bg-white text-black border-none hover:bg-primary hover:text-black font-black h-14 uppercase text-[11px] tracking-widest transition-all rounded-xl shadow-lg relative">
                    <Link href="/report">Sincronizar & Gerar</Link>
                  </Button>
               </section>
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-border/50 bg-white flex items-center justify-center gap-6 text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.4em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span>Advanced Monitoring • Handcrafted for Davi Alves Figueredo</span>
        </footer>
      </main>
    </div>
  );
}
