"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  RefreshCcw, 
  FileDown, 
  FileCheck,
  Copyright,
  TrendingUp,
  Activity,
  Cpu,
  Clock,
  Calendar,
  AlertTriangle,
  Zap,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';
import { getTranslation, Locale } from '@/lib/i18n';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function Dashboard() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<Locale>('pt');
  const [iaInsights, setIaInsights] = useState<any>(null);

  const t = getTranslation(locale);

  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem('lexisPredict_locale') as Locale;
    if (savedLocale) setLocale(savedLocale);
    
    const savedInsights = localStorage.getItem('lexisPredict_notes_analysis');
    if (savedInsights) setIaInsights(JSON.parse(savedInsights));
  }, []);

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
    
    // Filtro estrito: Demandas Ativas ignoram Encerrados/Arquivados/Suspensos
    const activeDemands = cases.filter(c => !['Encerrado', 'Arquivado', 'Extinto', 'Suspenso'].includes(c.situacao)).length;
    
    const vencidos = cases.filter(c => c.status === 'Vencido').length;
    const venceHoje = cases.filter(c => c.status === 'É Hoje').length;
    const atencao = cases.filter(c => c.status === 'Atenção').length;
    const noPrazo = cases.filter(c => c.status === 'No Prazo').length; // Chamaremos de "Saudáveis"
    const semPrazo = cases.filter(c => c.status === 'Sem Prazo').length;

    const vencidosArray = cases.filter(c => c.status === 'Vencido' && c.diasFaltando !== null);
    const tempoMedio = vencidosArray.length > 0 
      ? Math.round(Math.abs(vencidosArray.reduce((acc, c) => acc + (c.diasFaltando || 0), 0)) / vencidosArray.length) 
      : 0;

    // Risco Ponderado por Gravidade
    const riskSum = (vencidos * 1.0) + (venceHoje * 0.8) + (atencao * 0.5) + (noPrazo * 0.1);
    const activeTotal = vencidos + venceHoje + atencao + noPrazo;
    const riskScore = activeTotal > 0 ? Math.min(100, Math.round((riskSum / activeTotal) * 100)) : 0;

    const statusData = [
      { name: 'Vencidos', value: vencidos, color: '#ef4444' },
      { name: 'Hoje', value: venceHoje, color: '#f59e0b' },
      { name: 'Atenção', value: atencao, color: '#fbbf24' },
      { name: 'Saudáveis', value: noPrazo, color: '#22c55e' },
      { name: 'Sem Prazo', value: semPrazo, color: '#94a3b8' },
    ].filter(d => d.value > 0);

    return { totalRepo, activeDemands, vencidos, venceHoje, atencao, tempoMedio, riskScore, statusData };
  }, [cases]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase">{t.controlPanel}</h1>
            <div className="hidden xl:flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-l border-border/30 pl-6">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {t.activeTelemetry}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex border-border/50 hover:border-primary hover:bg-primary/10 text-xs font-semibold h-9 px-6 rounded-sm uppercase tracking-wider transition-all">
              <Link href="/report">
                <FileDown size={14} className="mr-2" /> Dossiê Operacional
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} className="h-9 w-9 text-muted-foreground hover:text-primary">
               <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-10">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Vencem Hoje" value={loading ? "..." : metrics.venceHoje} icon={<Clock size={16} />} color={metrics.venceHoje > 0 ? "destructive" : "primary"} />
            <StatCard title="Vencidos" value={loading ? "..." : metrics.vencidos} icon={<ShieldAlert size={16} />} color="destructive" />
            <StatCard title="Demandas Ativas" value={loading ? "..." : metrics.activeDemands} icon={<Activity size={16} />} color="primary" />
            <StatCard title="Atraso Médio" value={loading ? "..." : `${metrics.tempoMedio} dias`} icon={<TrendingUp size={16} />} color="destructive" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Saúde da Carteira Ativa</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={metrics.statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {metrics.statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Insights de Auditoria (IA)</h3>
                       <Badge variant="outline" className="text-[8px] border-primary/30 text-primary">v9.0 Elite</Badge>
                    </div>
                    {iaInsights ? (
                      <div className="space-y-4 overflow-auto flex-1 pr-2 custom-scrollbar">
                         <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-sm">
                            <p className="text-[8px] font-black text-green-500 uppercase flex items-center gap-1.5 mb-1.5"><TrendingUp size={10}/> Pontos Fortes</p>
                            <p className="text-[10px] font-medium leading-relaxed opacity-80 uppercase">{iaInsights.strongPoints}</p>
                         </div>
                         <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
                            <p className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1.5 mb-1.5"><TrendingDown size={10}/> Riscos Detectados</p>
                            <p className="text-[10px] font-medium leading-relaxed opacity-80 uppercase">{iaInsights.negativePoints}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
                         <Sparkles size={32} className="mb-4" />
                         <p className="text-[10px] font-bold uppercase">Nenhuma auditoria de notas gerada.</p>
                         <Link href="/notes" className="text-[9px] underline mt-2 uppercase">Ir para Evidências</Link>
                      </div>
                    )}
                  </section>
               </div>

               <section className="space-y-4">
                <div className="bg-card border border-border/50 rounded-md overflow-hidden">
                  <div className="p-4 border-b border-border/10 bg-secondary/5 flex items-center justify-between">
                     <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Processos com Prazo Crítico</h3>
                     <Badge className="bg-red-500 text-white font-black text-[9px] uppercase">{metrics.vencidos + metrics.venceHoje} ALERTA</Badge>
                  </div>
                  <table className="mission-control-table">
                    <thead>
                      <tr>
                        <th>Tribunal</th>
                        <th>Cliente</th>
                        <th>Protocolo</th>
                        <th className="text-right">Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.filter(c => ['Vencido', 'É Hoje'].includes(c.status)).slice(0, 10).map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td><Badge variant="outline" className="text-[9px] font-bold uppercase">{c.tribunal}</Badge></td>
                          <td className="font-bold uppercase text-[11px]">{c.cliente}</td>
                          <td className="font-mono text-[10px] text-muted-foreground">{c.protocolo}</td>
                          <td className="text-right">
                            <span className="text-[9px] font-black uppercase text-red-500">
                              {(c.diasFaltando || 0) < 0 ? `${Math.abs(c.diasFaltando || 0)}d atraso` : "Hoje"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="bg-card border border-border/50 rounded-md p-6 space-y-4">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">Índice de Risco (Gabinete)</p>
                   <span className={cn("text-2xl font-black", metrics.riskScore > 80 ? "text-red-500" : "text-primary")}>{metrics.riskScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div className={cn("h-full transition-all duration-1000", metrics.riskScore > 80 ? "bg-red-500" : "bg-primary")} style={{ width: `${metrics.riskScore}%` }} />
                </div>
                <p className="text-[9px] font-bold uppercase text-center opacity-40">
                  {metrics.riskScore > 80 ? "Nível: Crítico" : metrics.riskScore > 60 ? "Nível: Alto" : "Nível: Moderado"}
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-md p-6 space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-tight">Dossiê Operacional</h2>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed uppercase">Relatório completo de auditoria executiva, incluindo logs de evidências e notas estratégicas.</p>
                  </div>
                  <Button variant="default" asChild className="w-full bg-primary text-black font-bold h-11 rounded-sm uppercase text-[10px] tracking-[0.15em] hover:bg-primary/90 transition-all">
                    <Link href="/report">Gerar Relatório Executivo</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
