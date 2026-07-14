
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LegalCase, CaseNote } from "@/lib/case-logic";
import { Button } from "@/components/ui/button";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  Activity,
  Copyright,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Scale,
  Zap,
  Eye,
  TrendingUp,
  StickyNote,
  Sparkles,
  TrendingDown
} from "lucide-react";
import Link from "next/link";
import { fetchRepoCases, fetchRepoNotes } from "@/app/actions/case-actions";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export default function UnifiedReport() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [iaInsights, setIaInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        const [casesData, notesData] = await Promise.all([
          fetchRepoCases(),
          fetchRepoNotes()
        ]);
        setCases(casesData || []);
        setNotes(notesData || []);
        
        const savedInsights = localStorage.getItem('lexisPredict_notes_analysis');
        if (savedInsights) {
           try {
             setIaInsights(JSON.parse(savedInsights));
           } catch(e) {}
        }
      } catch (e) {
        console.error("Report extraction failure:", e);
      } finally {
        setLoading(false);
      }
    }
    if (mounted && !authLoading) load();
  }, [mounted, authLoading]);

  const metrics = useMemo(() => {
    const totalRepo = cases.length;
    // Carteira Ativa: Exclui registros já finalizados estrategicamente
    const ativos = cases.filter(c => !['Encerrado', 'Arquivado', 'Extinto', 'Suspenso'].includes(c.situacao));
    const activeTotal = ativos.length;
    
    // Categorização Estrita (Soma exata)
    const countVencido = cases.filter(c => c.status === 'Vencido' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const countHoje = cases.filter(c => c.status === 'É Hoje' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const countAtencao = cases.filter(c => c.status === 'Atenção' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const countSaudavel = cases.filter(c => c.status === 'No Prazo' && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    const countSemPrazo = cases.filter(c => (c.status === 'Sem Prazo' || !c.proximoPrazo) && !['Encerrado', 'Arquivado'].includes(c.situacao)).length;
    
    const countFinalizados = cases.filter(c => ['Encerrado', 'Arquivado'].includes(c.situacao)).length;

    // Índice de Risco Ponderado (Somente sobre Ativos)
    const riskSum = (countVencido * 1.0) + (countHoje * 0.8) + (countAtencao * 0.5) + (countSaudavel * 0.1);
    const riskScore = activeTotal > 0 ? Math.min(100, Math.round((riskSum / activeTotal) * 100)) : 0;

    let riskLabel = "BAIXO";
    let riskColor = "text-emerald-400";
    if (riskScore > 80) { riskLabel = "CRÍTICO"; riskColor = "text-red-500"; }
    else if (riskScore > 60) { riskLabel = "ALTO"; riskColor = "text-orange-500"; }
    else if (riskScore > 40) { riskLabel = "ELEVADO"; riskColor = "text-yellow-500"; }
    else if (riskScore > 20) { riskLabel = "MODERADO"; riskColor = "text-amber-400"; }

    return {
      totalRepo, activeTotal, countVencido, countHoje, countAtencao, countSaudavel, countSemPrazo, countFinalizados, riskScore, riskLabel, riskColor
    };
  }, [cases]);

  const prioritaryCases = useMemo(() => {
    return cases
      .filter(c => ["Vencido", "É Hoje", "Atenção"].includes(c.status) && !['Encerrado', 'Arquivado'].includes(c.situacao))
      .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
      .slice(0, 50);
  }, [cases]);

  const handleExportPDF = () => window.print();

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] space-y-6">
        <div className="w-16 h-16 border-2 border-[#c9a227]/30 border-t-[#c9a227] rounded-full animate-spin" />
        <p className="font-light tracking-[0.4em] text-[11px] text-[#c9a227] uppercase">Sincronizando Dossiê Operacional</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#c9a227]/30">
      <div className="print:hidden sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" asChild className="text-white/70 hover:text-white hover:bg-white/5 font-medium tracking-wide text-xs uppercase rounded-none h-10 px-4">
            <Link href="/"><ArrowLeft size={14} className="mr-2" /> Voltar ao Gabinete</Link>
          </Button>
          <Button onClick={handleExportPDF} className="bg-[#c9a227] hover:bg-[#d4af37] text-black font-bold uppercase text-[10px] tracking-widest h-11 px-7 rounded-none transition-all">
            <Printer size={14} className="mr-2" /> Exportar Dossiê Operacional
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 print:px-0 print:py-0">
        <div className="bg-[#111111] border border-white/10 print:border-0 print:bg-[#0a0a0a] shadow-2xl">
          <header className="relative overflow-hidden border-b border-white/5">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
            <div className="px-10 pt-12 pb-10 flex flex-col lg:flex-row justify-between gap-8">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-[#c9a227] flex items-center justify-center"><Scale size={16} className="text-[#c9a227]" /></div>
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#c9a227] font-medium">W1 Capital • Advanced Ops</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] text-white">DOSSIÊ OPERACIONAL<br /><span className="text-[#c9a227]">DA CARTEIRA</span></h1>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="px-3 py-1.5 bg-[#c9a227] text-black text-[10px] font-bold tracking-widest uppercase">GABINETE EXECUTIVO</div>
                  <div className="flex items-center gap-2 text-[11px] text-white/50"><Calendar size={12} />{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                </div>
              </div>
              <div className="text-right space-y-2 self-end">
                <p className="text-sm font-medium tracking-wide text-white">{profile?.nome || "ADMINISTRADOR"}</p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Auditado sob protocolo v250.0 Elite</p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 border border-emerald-500/40 text-emerald-400 text-[9px] font-medium tracking-widest uppercase"><ShieldCheck size={11} /> Autenticado</div>
              </div>
            </div>
          </header>

          <section className="px-10 py-10 bg-black/40">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-4 bg-black border border-white/10 p-7 flex flex-col justify-between min-h-[220px]">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4">Índice de Risco Calculado</p>
                  <div className="flex items-end gap-3">
                    <span className={cn("text-7xl font-black tracking-tighter leading-none", metrics.riskColor)}>{metrics.riskScore}</span>
                    <span className="text-white/30 text-lg font-light mb-2">/100</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className={cn("text-xs font-bold tracking-[0.2em] uppercase", metrics.riskColor)}>{metrics.riskLabel}</span>
                  <div className="h-1.5 flex-1 mx-4 bg-white/10 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", metrics.riskColor.replace('text', 'bg'))} style={{ width: `${metrics.riskScore}%` }} />
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={<Activity size={16} />} label="Ativos em Gestão" value={metrics.activeTotal} accent="text-blue-400" />
                <KpiCard icon={<AlertTriangle size={16} />} label="Processos Vencidos" value={metrics.countVencido} accent="text-red-500" highlight={metrics.countVencido > 0} />
                <KpiCard icon={<CheckCircle2 size={16} />} label="Casos Saudáveis" value={metrics.countSaudavel} accent="text-emerald-400" />
                <KpiCard icon={<Clock size={16} />} label="Vencem Hoje" value={metrics.countHoje} accent="text-orange-400" highlight={metrics.countHoje > 0} />
              </div>
            </div>
          </section>

          <section className="px-10 pb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-5 bg-[#c9a227]" />
              <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60">Distribuição Operacional (Carteira Total: {metrics.totalRepo})</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatusPill label="Vencidos" count={metrics.countVencido} total={metrics.activeTotal} color="bg-red-600" />
              <StatusPill label="Hoje" count={metrics.countHoje} total={metrics.activeTotal} color="bg-orange-500" />
              <StatusPill label="Atenção" count={metrics.countAtencao} total={metrics.activeTotal} color="bg-amber-400" />
              <StatusPill label="Saudáveis" count={metrics.countSaudavel} total={metrics.activeTotal} color="bg-emerald-500" />
              <StatusPill label="Sem Prazo" count={metrics.countSemPrazo} total={metrics.activeTotal} color="bg-slate-400" />
              <StatusPill label="Finalizados" count={metrics.countFinalizados} total={metrics.totalRepo} color="bg-slate-800" />
            </div>
          </section>

          {iaInsights && (
            <section className="px-10 pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 bg-[#c9a227]" />
                <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60">Parecer Estratégico da IA</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 p-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-[#c9a227] uppercase tracking-[0.2em] flex items-center gap-2"><Sparkles size={12}/> Pontos Fortes de Gabinete</p>
                    <ul className="space-y-2">
                      {iaInsights.pontosFortes?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs leading-relaxed opacity-70 uppercase font-medium">• {item}</li>
                      ))}
                    </ul>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2"><TrendingDown size={12}/> Riscos e Negativos Detectados</p>
                    <ul className="space-y-2">
                      {iaInsights.riscosDetectados?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs leading-relaxed opacity-70 uppercase font-medium">• {item}</li>
                      ))}
                    </ul>
                 </div>
              </div>
            </section>
          )}

          <section className="px-10 pb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-red-600" />
                <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60">Triagem de Prioridade Máxima</h2>
              </div>
            </div>
            <div className="border border-white/10 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 border-b border-white/10">Cliente / Tribunal</th>
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 border-b border-white/10">Protocolo</th>
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 border-b border-white/10">Prazo</th>
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 border-b border-white/10">Tempo</th>
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 border-b border-white/10 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {prioritaryCases.map((c, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white leading-tight">{c.cliente}</p>
                        <p className="text-[9px] text-[#c9a227] tracking-widest uppercase mt-0.5">{c.tribunal || "Outros"}</p>
                      </td>
                      <td className="px-5 py-4"><p className="text-[11px] font-mono text-white/60">{c.protocolo}</p></td>
                      <td className="px-5 py-4"><p className="text-sm text-white/80">{c.proximoPrazo}</p></td>
                      <td className="px-5 py-4">
                        <p className={cn(
                          "text-[10px] font-black uppercase",
                          (c.diasFaltando || 0) < 0 ? "text-red-500" : "text-white/60"
                        )}>
                          {(c.diasFaltando || 0) < 0 ? `${Math.abs(c.diasFaltando || 0)}d atraso` : (c.diasFaltando === 0 ? "Vence Hoje" : `Faltam ${c.diasFaltando} dias`)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "inline-block px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase border",
                          c.status === 'Vencido' ? "bg-red-500/20 text-red-500 border-red-500/30" : 
                          c.status === 'É Hoje' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : 
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
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

          <section className="px-10 pb-12 break-before-page">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-5 bg-[#c9a227]" />
              <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60">Log de Evidências & Notas Estratégicas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {notes.map((note) => (
                 <div key={note.id} className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                       <span className="text-[8px] font-black text-[#c9a227] uppercase tracking-[0.2em]">{note.updatedAt}</span>
                       <StickyNote size={10} className="opacity-20" />
                    </div>
                    <h3 className="text-xs font-bold uppercase text-white leading-tight">{note.title}</h3>
                    <p className="text-[10px] leading-relaxed opacity-60 uppercase tracking-widest flex-1">{note.content}</p>
                 </div>
               ))}
               {notes.length === 0 && (
                 <div className="col-span-2 py-10 text-center border border-dashed border-white/10">
                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-[0.3em]">Nenhuma evidência registrada.</p>
                 </div>
               )}
            </div>
          </section>

          <footer className="px-10 py-10 border-t border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-[#c9a227]/50 flex items-center justify-center"><Zap size={16} className="text-[#c9a227]" /></div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">2026 W1 Capital</p>
                  <p className="text-xs text-white/60 font-medium">Relatório Executivo Operacional</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10">
                <ShieldCheck size={13} className="text-[#c9a227]" />
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Auditado por Davi Alves Figueredo</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { 
            background-color: #0a0a0a !important; 
            color: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .bg-black\/40 { background-color: rgba(0,0,0,0.4) !important; }
          .bg-white\/\[0\.03\] { background-color: rgba(255,255,255,0.03) !important; }
          .bg-white\/\[0\.02\] { background-color: rgba(255,255,255,0.02) !important; }
          .text-\[\#c9a227\] { color: #c9a227 !important; }
          .border-\[\#c9a227\] { border-color: #c9a227 !important; }
          .print-black { background-color: #0a0a0a !important; }
          * { border-color: rgba(255,255,255,0.1) !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ icon, label, value, accent, highlight = false }: { icon: React.ReactNode; label: string; value: number; accent: string; highlight?: boolean; }) {
  return (
    <div className={cn("bg-black border p-5 flex flex-col justify-between min-h-[140px]", highlight ? "border-red-500/40" : "border-white/10")}>
      <div className={cn("mb-4", accent)}>{icon}</div>
      <div>
        <p className="text-3xl font-black tracking-tighter text-white tabular-nums">{value}</p>
        <p className="text-[9px] tracking-[0.15em] uppercase text-white/40 mt-1.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function StatusPill({ label, count, total, color }: { label: string; count: number; total: number; color: string; }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-black/50 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-wide text-white/50 uppercase">{label}</span>
        <span className="text-xl font-black text-white tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 overflow-hidden rounded-full">
        <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[9px] text-white/30 mt-2 tabular-nums">{pct}%</p>
    </div>
  );
}
