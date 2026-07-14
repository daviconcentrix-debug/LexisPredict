
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

  /**
   * Carrega os insights da IA salvos no localStorage
   */
  const loadInsights = useCallback(() => {
    const savedInsights = localStorage.getItem('lexisPredict_notes_analysis');
    if (savedInsights) {
      try {
        const parsed = JSON.parse(savedInsights);
        // Só define se houver conteúdo real
        if (parsed && (parsed.pontosFortes?.length > 0 || parsed.riscosDetectados?.length > 0)) {
          setIaInsights(parsed);
        } else {
          setIaInsights(null);
        }
      } catch (e) {
        console.error("Fail load insights");
        setIaInsights(null);
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem('lexisPredict_locale') as Locale;
    if (savedLocale) setLocale(savedLocale);
    
    loadInsights();

    // Sincronia entre telas: Escuta atualizações de outras janelas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lexisPredict_notes_analysis') loadInsights();
    };
    
    // Sincronia na mesma janela: Escuta evento customizado disparado pela página de Notas
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('lexis-insights-updated', loadInsights);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('lexis-insights-updated', loadInsights);
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
    // Demandas Ativas: Exclui Encerrados/Arquivados
    const ativos = cases.filter(c => !['Encerrado', 'Arquivado', 'Extinto', 'Suspenso', 'Sem Prazo'].includes(c.status) && !['Encerrado', 'Arquivado'].includes(c.situacao));
    const activeDemands = ativos.length;
    
    // Status Individuais para soma exata (Carteira Ativa Total = 246)
    const vencidos = cases.filter(c => c.status === 'Vencido' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const venceHoje = cases.filter(c => c.status === 'É Hoje' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const atencao = cases.filter(c => c.status === 'Atenção' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const noPrazo = cases.filter(c => c.status === 'No Prazo' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length; 
    const semPrazo = cases.filter(c => (c.status === 'Sem Prazo' || !c.proximoPrazo) && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const finalizados = cases.filter(c => ['Encerrado', 'Arquivado'].includes(c.status) || ['Encerrado', 'Arquivado'].includes(c.situacao)).length;

    // Tempo Médio de Atraso
    const vencidosArray = cases.filter(c => c.status === 'Vencido' && c.diasFaltando !== null);
    const tempoMedio = vencidosArray.length > 0 
      ? Math.round(Math.abs(vencidosArray.reduce((acc, c) => acc + (c.diasFaltando || 0), 0)) / vencidosArray.length) 
      : 0;

    // Índice de Risco Ponderado (Somente sobre o que não está finalizado)
    const riskSum = (vencidos * 1.0) + (venceHoje * 0.8) + (atencao * 0.5) + (noPrazo * 0.1);
    const totalConsiderado = (vencidos + venceHoje + atencao + noPrazo + semPrazo);
    const riskScore = totalConsiderado > 0 ? Math.min(100, Math.round((riskSum / totalConsiderado) * 100)) : 0;

    const statusData = [
      { name: 'Vencidos', value: vencidos, color: '#ef4444' },
      { name: 'Hoje', value: venceHoje, color: '#f97316' },
      { name: 'Atenção', value: atencao, color: '#fbbf24' },
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
            <StatCard title="Próximos 7 Dias" value={loading ? "..." : metrics.atencao} icon={<Calendar size={16} />} color="accent" />
            <StatCard title="Atraso Médio" value={loading ? "..." : `${metrics.tempoMedio} dias`} icon={<TrendingUp size={16} />} color="destructive" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Saúde da Carteira (Total: {metrics.activeDemands + metrics.semPrazo})</h3>
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
                    <div className="grid grid-cols-3 gap-2 mt-4">
                       <StatusMiniPill color="bg-red-500" label="Vencidos" value={metrics.vencidos} />
                       <StatusMiniPill color="bg-orange-500" label="Atenção" value={metrics.atencao} />
                       <StatusMiniPill color="bg-green-500" label="Saudáveis" value={metrics.noPrazo} />
                    </div>
                  </section>

                  <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Insights de Auditoria (IA)</h3>
                       <Badge variant="outline" className="text-[8px] border-primary/30 text-primary uppercase">v25.0 Elite</Badge>
                    </div>
                    {iaInsights ? (
                      <div className="space-y-4 overflow-auto flex-1 pr-2 custom-scrollbar">
                         {iaInsights.pontosFortes?.length > 0 && (
                           <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-sm">
                              <p className="text-[8px] font-black text-green-500 uppercase flex items-center gap-1.5 mb-1.5"><TrendingUp size={10}/> Pontos Fortes</p>
                              <ul className="space-y-1">
                                {iaInsights.pontosFortes.map((item: string, idx: number) => (
                                  <li key={idx} className="text-[10px] font-medium leading-relaxed opacity-80 uppercase">• {item}</li>
                                ))}
                              </ul>
                           </div>
                         )}
                         {iaInsights.riscosDetectados?.length > 0 && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
                              <p className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1.5 mb-1.5"><TrendingDown size={10}/> Riscos Detectados</p>
                              <ul className="space-y-1">
                                {iaInsights.riscosDetectados.map((item: string, idx: number) => (
                                  <li key={idx} className="text-[10px] font-medium leading-relaxed opacity-80 uppercase">• {item}</li>
                                ))}
                              </ul>
                           </div>
                         )}
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
                     <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Processos que exigem ação imediata</h3>
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
                      {cases
                        .filter(c => ['Vencido', 'É Hoje', 'Atenção'].includes(c.status) && !['Encerrado', 'Arquivado'].includes(c.situacao))
                        .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
                        .slice(0, 40)
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                            <td><Badge variant="outline" className="text-[9px] font-bold uppercase">{c.tribunal}</Badge></td>
                            <td className="font-bold uppercase text-[11px]">{c.cliente}</td>
                            <td className="font-mono text-[10px] text-muted-foreground">{c.protocolo}</td>
                            <td className="text-right">
                              <span className={cn("text-[9px] font-black uppercase", (c.diasFaltando || 0) < 0 ? "text-red-500" : "text-orange-500")}>
                                {c.status === 'É Hoje' ? "Hoje" : (c.diasFaltando || 0) < 0 ? `${Math.abs(c.diasFaltando || 0)}d atraso` : `Faltam ${c.diasFaltando}d`}
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
                   <span className={cn("text-2xl font-black", metrics.riskScore > 80 ? "text-red-500" : metrics.riskScore > 60 ? "text-orange-500" : "text-primary")}>{metrics.riskScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div className={cn("h-full transition-all duration-1000", metrics.riskScore > 80 ? "bg-red-500" : metrics.riskScore > 60 ? "bg-orange-500" : "bg-primary")} style={{ width: `${metrics.riskScore}%` }} />
                </div>
                <p className="text-[9px] font-bold uppercase text-center opacity-40">
                  {metrics.riskScore > 80 ? "Nível: Crítico" : metrics.riskScore > 60 ? "Nível: Alto" : metrics.riskScore > 40 ? "Nível: Elevado" : "Nível: Moderado"}
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-md p-6 space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-tight">Dossiê Operacional</h2>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed uppercase">Relatório completo de auditoria executiva, incluindo logs de evidências e parecer técnico da IA.</p>
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

function StatusMiniPill({ color, label, value }: { color: string, label: string, value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-secondary/10 rounded-sm border border-border/10">
       <div className={cn("w-2 h-2 rounded-full", color)} />
       <span className="text-[8px] font-bold uppercase text-muted-foreground">{label}</span>
       <span className="text-xs font-black">{value}</span>
    </div>
  );
}
