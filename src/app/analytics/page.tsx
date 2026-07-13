
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { buildExecutiveInsight } from "@/lib/performance-engine";
import { 
  ShieldAlert, 
  Scale, 
  Users,
  FileDown,
  RefreshCcw,
  Copyright,
  UserCheck,
  ShieldCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchRepoCases, fetchRepoNotes } from '@/app/actions/case-actions';

export default function AnalyticsPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function load() {
      setLoading(true);
      const [repoData, notesData] = await Promise.all([
        fetchRepoCases(),
        fetchRepoNotes()
      ]);
      if (repoData) setCases(repoData);
      if (notesData) setNotes(notesData);
      setLoading(false);
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = cases.length;
    const statusCounts = { Vencido: 0, Atenção: 0, 'No Prazo': 0, Arquivado: 0, 'Sem Prazo': 0 };
    const tribunalCounts: Record<string, number> = {};
    const attorneyCounts: Record<string, number> = {};

    cases.forEach(c => {
      const situacao = (c.situacao || '').toUpperCase();
      const isArchived = ['ENCERRADO', 'SUSPENSO', 'ARQUIVADO'].some(s => situacao.includes(s));
      
      if (isArchived) {
        statusCounts.Arquivado++;
      } else {
        const status = c.status || 'Sem Prazo';
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status as keyof typeof statusCounts]++;
        } else {
          statusCounts['Sem Prazo']++;
        }
      }

      tribunalCounts[c.tribunal || "Outros"] = (tribunalCounts[c.tribunal || "Outros"] || 0) + 1;
      attorneyCounts[c.advogado || "NÃO ATRIBUÍDO"] = (attorneyCounts[c.advogado || "NÃO ATRIBUÍDO"] || 0) + 1;
    });

    const topTribunals = Object.entries(tribunalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topAttorneys = Object.entries(attorneyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Performance Insight
    const insight = buildExecutiveInsight(cases, notes);

    return { 
      total, 
      statusCounts, 
      topTribunals, 
      topAttorneys,
      insight
    };
  }, [cases, notes]);

  const getPercent = (val: number) => metrics.total ? Math.round((val / metrics.total) * 100) : 0;

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 print:hidden shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Indicadores Analytics</h1>
            <Badge variant="outline" className="text-black border-black font-black uppercase text-[10px]">Performance Engine v1.0</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="text-black border-black h-8 font-black uppercase hover:bg-black hover:text-white transition-all">
              <FileDown size={14} className="mr-2" /> Exportar Dossiê
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="text-black hover:bg-black hover:text-white">
              <RefreshCcw size={16} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8 max-w-7xl mx-auto w-full print:p-0">
          {/* PERFORMANCE HEADER OVERVIEW */}
          <section className="bg-black text-white p-10 flex flex-col lg:flex-row justify-between items-center gap-8 rounded-sm shadow-xl">
             <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-full border-8 border-white/10 border-t-[#c9a227] flex items-center justify-center">
                   <span className="text-3xl font-black text-[#c9a227]">{metrics.insight.summary.performanceScore}</span>
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tight">Status de Auditoria Individual</h2>
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Gabinete em Nível {metrics.insight.summary.performanceLabel}</p>
                </div>
             </div>
             <div className="flex gap-10">
                <div className="text-center">
                   <p className="text-[10px] font-black text-white/40 uppercase mb-1">Culpabilidade Externa</p>
                   <p className="text-3xl font-black text-emerald-400">-{metrics.insight.person.notMyFaultCount}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-white/40 uppercase mb-1">Incidentes Críticos</p>
                   <p className="text-3xl font-black text-red-500">{metrics.insight.summary.criticalCount}</p>
                </div>
             </div>
          </section>

          <section className="bg-white border border-[#dddbda] rounded-sm p-8 shadow-sm group hover:bg-black transition-all cursor-default">
            <div className="flex items-center gap-3 mb-8 print:hidden">
              <div className="icon-3d-wrapper">
                <div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white">
                  <ShieldAlert className="text-white group-hover:text-black w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Saúde Procedural</h2>
                <p className="text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase">Distribuição de casos via nuvem W1 Capital.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricItem label="Vencido (Crítico)" value={metrics.statusCounts.Vencido} pct={getPercent(metrics.statusCounts.Vencido)} color="bg-red-600" />
              <MetricItem label="Atenção (Alerta)" value={metrics.statusCounts.Atenção} pct={getPercent(metrics.statusCounts.Atenção)} color="bg-orange-500" />
              <MetricItem label="No Prazo (Saudável)" value={metrics.statusCounts['No Prazo'] + metrics.statusCounts['Sem Prazo']} pct={getPercent(metrics.statusCounts['No Prazo'] + metrics.statusCounts['Sem Prazo'])} color="bg-green-600" />
              <MetricItem label="Arquivado / Encerrado" value={metrics.statusCounts.Arquivado} pct={getPercent(metrics.statusCounts.Arquivado)} color="bg-gray-400" />
            </div>

            <div className="h-3 w-full bg-[#f3f2f2] rounded-full flex overflow-hidden border border-[#dddbda] group-hover:border-white/20 transition-all">
              <div style={{ width: `${getPercent(metrics.statusCounts.Vencido)}%` }} className="bg-red-600 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.statusCounts.Atenção)}%` }} className="bg-orange-500 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.statusCounts['No Prazo'] + metrics.statusCounts['Sem Prazo'])}%` }} className="bg-green-600 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.statusCounts.Arquivado)}%` }} className="bg-gray-400 h-full transition-all duration-1000" />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            <section className="bg-white border border-[#dddbda] rounded-sm p-8 hover:bg-black group transition-all cursor-default">
              <div className="flex items-center gap-3 mb-8 print:hidden">
                <div className="icon-3d-wrapper">
                  <div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white">
                    <AlertTriangle className="text-white group-hover:text-black w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Culpabilidade Identificada</h2>
                </div>
              </div>

              <div className="space-y-7">
                  <FaultRow label="Responsabilidade do Advogado" count={metrics.insight.byFault.advogado.length} color="bg-amber-400" total={metrics.total} />
                  <FaultRow label="Responsabilidade do Operador" count={metrics.insight.byFault.operador.length} color="bg-red-600" total={metrics.total} />
                  <FaultRow label="Fatores Externos (Sem Culpa)" count={metrics.insight.byFault.externo.length} color="bg-emerald-400" total={metrics.total} />
              </div>
            </section>

            <section className="bg-white border border-[#dddbda] rounded-sm p-8 hover:bg-black group transition-all cursor-default">
              <div className="flex items-center gap-3 mb-8 print:hidden">
                <div className="icon-3d-wrapper">
                  <div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white">
                    <UserCheck className="text-white group-hover:text-black w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Recomendações do Auditor</h2>
                </div>
              </div>

              <div className="space-y-4">
                 {metrics.insight.person.recommendations.map((r, i) => (
                   <div key={i} className="flex gap-4 p-4 border-2 border-dashed border-black/10 group-hover:border-white/20 transition-all">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <p className="text-[11px] font-black text-black/60 group-hover:text-white/80 uppercase leading-relaxed">{r}</p>
                   </div>
                 ))}
              </div>
            </section>
          </div>
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

function MetricItem({ label, value, pct, color }: { label: string, value: number, pct: number, color: string }) {
  return (
    <div className="p-5 bg-[#f3f2f2] border border-[#dddbda] rounded-sm group-hover:bg-gray-900 group-hover:border-white/10 transition-all">
      <p className="text-[10px] font-black text-black/60 group-hover:text-white/60 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-black text-black group-hover:text-white leading-none">{value}</span>
        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded text-white mb-0.5", color)}>{pct}%</span>
      </div>
    </div>
  );
}

function FaultRow({ label, count, color, total }: { label: string, count: number, color: string, total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">
        <span>{label}</span>
        <span className="text-black/60 group-hover:text-white/60">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 w-full bg-[#f3f2f2] rounded-full overflow-hidden border border-[#dddbda] group-hover:border-white/10 transition-all">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
