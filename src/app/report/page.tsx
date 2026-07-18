
"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

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
  TrendingUp,
  Sparkles,
  TrendingDown,
  Layout,
  Layers,
  FileCode,
  Search,
  Users,
  Info,
  ChevronLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { fetchRepoCases, fetchRepoNotes } from "@/app/actions/case-actions";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { saveAs } from 'file-saver';
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import { Input } from "@/components/ui/input";

type ReportStyle = 'classic' | 'omni';

export default function UnifiedReport() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [iaInsights, setIaInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [reportStyle, setReportStyle] = useState<ReportStyle>('classic');
  const [omniSearch, setOmniSearch] = useState('');
  
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

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
    const ativos = cases.filter(c => !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()));
    const activeTotal = ativos.length;
    
    const countVencido = cases.filter(c => c.status === 'Vencido' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const countHoje = cases.filter(c => c.status === 'É Hoje' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const countAtencao = cases.filter(c => c.status === 'Atenção' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const countSaudavel = cases.filter(c => c.status === 'No Prazo' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    const countSemPrazo = cases.filter(c => (c.status === 'Sem Prazo' || !c.proximoPrazo) && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length;
    
    const countFinalizados = cases.filter(c => ['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()) || c.status === 'Arquivado' || c.status === 'Encerrado').length;

    const riskSum = (countVencido * 1.0) + (countHoje * 0.8) + (countAtencao * 0.5) + (countSaudavel * 0.1);
    const riskScore = activeTotal > 0 ? Math.min(100, Math.round((riskSum / activeTotal) * 100)) : 0;

    let riskLabel = "BAIXO";
    let riskColor = "text-green-600";
    if (riskScore > 80) { riskLabel = "CRÍTICO"; riskColor = "text-red-600"; }
    else if (riskScore > 60) { riskLabel = "ALTO"; riskColor = "text-orange-600"; }
    else if (riskScore > 40) { riskLabel = "ELEVADO"; riskColor = "text-amber-600"; }
    else if (riskScore > 20) { riskLabel = "MODERADO"; riskColor = "text-blue-600"; }

    const tribCounts: Record<string, number> = {};
    cases.forEach(c => {
      const name = c.tribunal || 'Outros';
      tribCounts[name] = (tribCounts[name] || 0) + 1;
    });

    const chartData = Object.entries(tribCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.split(' - ')[0], count }));

    return {
      totalRepo, 
      activeTotal, 
      countVencido, 
      countHoje, 
      countAtencao, 
      countSaudavel, 
      countSemPrazo, 
      countFinalizados, 
      riskScore, 
      riskLabel, 
      riskColor,
      chartData,
      topTribunal: Object.entries(tribCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'TJSP'
    };
  }, [cases]);

  const prioritaryCases = useMemo(() => {
    return cases
      .filter(c => ["Vencido", "É Hoje", "Atenção"].includes(c.status) && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()))
      .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
      .slice(0, 50);
  }, [cases]);

  const handleExportPDF = () => window.print();

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f2f2] space-y-6">
        <Loader2 className="w-12 h-12 text-black animate-spin" />
        <p className="font-black tracking-[0.4em] text-[10px] text-black uppercase">Sincronizando Dossiê Estratégico...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f2f2] text-black font-sans print:bg-white">
      {/* HEADER DE CONTROLE (OCULTO NA IMPRESSÃO) */}
      <div className="print:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" asChild className="text-black font-black hover:bg-black hover:text-white transition-all text-xs uppercase rounded-none border-2 border-transparent hover:border-black">
              <Link href="/"><ChevronLeft size={16} className="mr-1" /> Gabinete</Link>
            </Button>
            <div className="h-6 w-px bg-black/10 hidden sm:block" />
            <div className="flex bg-[#f3f2f2] p-1 border-2 border-black rounded-none gap-1">
               <button 
                 onClick={() => setReportStyle('classic')}
                 className={cn(
                   "px-6 py-1.5 text-[9px] font-black uppercase transition-all flex items-center gap-2 rounded-none",
                   reportStyle === 'classic' ? "bg-black text-white" : "text-black/40 hover:bg-black/5"
                 )}
               >
                 <Layout size={12} /> Classic PDF
               </button>
               <button 
                 onClick={() => setReportStyle('omni')}
                 className={cn(
                   "px-6 py-1.5 text-[9px] font-black uppercase transition-all flex items-center gap-2 rounded-none",
                   reportStyle === 'omni' ? "bg-black text-white" : "text-black/40 hover:bg-black/5"
                 )}
               >
                 <Layers size={12} /> Omni Premium
               </button>
            </div>
          </div>
          
          <Button onClick={handleExportPDF} className="bg-black text-white hover:bg-white hover:text-black border-2 border-black font-black uppercase text-[10px] tracking-widest h-11 px-8 rounded-none transition-all shadow-[4px_4px_0px_#00D1FF] hover:shadow-none">
            <Printer size={16} className="mr-2" /> Imprimir Dossiê Master
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 print:px-0 print:py-0 animate-in fade-in duration-700">
        <div className="bg-white border-2 border-black shadow-[12px_12px_0px_#000] print:border-0 print:shadow-none">
          {/* HEADER DO RELATÓRIO */}
          <header className="relative overflow-hidden border-b-2 border-black bg-[#fafafa]">
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="px-10 pt-16 pb-12 flex flex-col lg:flex-row justify-between gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black flex items-center justify-center rounded-none shadow-[4px_4px_0px_#00D1FF]"><Scale size={20} className="text-white" /></div>
                  <span className="text-[11px] tracking-[0.4em] uppercase text-black font-black">W1 Capital • Advanced Legal Ops</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.85] text-black uppercase">Dossiê<br />Operacional</h1>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Badge className="px-4 py-2 bg-black text-white text-[10px] font-black tracking-widest uppercase rounded-none">Relatório Consolidado</Badge>
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase text-black/60"><Calendar size={14} />{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                </div>
              </div>
              <div className="lg:text-right space-y-3 self-end">
                <div className="bg-[#f3f2f2] border-2 border-black p-4 inline-block text-left">
                  <p className="text-[10px] font-black uppercase text-black/40 tracking-widest">Auditor Titular</p>
                  <p className="text-sm font-black uppercase text-black">{profile?.nome || "FUNDADOR DAVI ALVES FIGUEREDO"}</p>
                </div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-black/40 font-bold">Autenticado sob protocolo v85.0 Stable</p>
                <div className="flex lg:justify-end">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border-2 border-green-600 text-green-600 text-[9px] font-black tracking-widest uppercase"><ShieldCheck size={12} /> Status: Sincronizado</div>
                </div>
              </div>
            </div>
          </header>

          {/* MATRIZ DE RISCO E KPIs */}
          <section className="p-10 bg-white border-b-2 border-black">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-4 bg-[#f3f2f2] border-2 border-black p-8 flex flex-col justify-between min-h-[250px] shadow-[6px_6px_0px_#000]">
                <div>
                  <p className="text-[11px] font-black tracking-[0.3em] uppercase text-black/40 mb-4">Índice de Risco Global</p>
                  <div className="flex items-end gap-3">
                    <span className={cn("text-8xl font-black tracking-tighter leading-none", metrics.riskColor)}>{metrics.riskScore}</span>
                    <span className="text-black/30 text-2xl font-black mb-3">%</span>
                  </div>
                </div>
                <div className="space-y-3 mt-8">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className={metrics.riskColor}>Status: {metrics.riskLabel}</span>
                    <span className="text-black/40">Escala de 100</span>
                  </div>
                  <div className="h-3 w-full bg-white border-2 border-black overflow-hidden rounded-none">
                    <div className={cn("h-full transition-all duration-1000", metrics.riskColor.replace('text', 'bg'))} style={{ width: `${metrics.riskScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                <KpiCard icon={<Activity size={20} />} label="Carteira Ativa" value={metrics.activeTotal} color="border-black" />
                <KpiCard icon={<AlertTriangle size={20} />} label="Prazos Vencidos" value={metrics.countVencido} color="border-red-600" textClass="text-red-600" />
                <KpiCard icon={<CheckCircle2 size={20} />} label="Casos Saudáveis" value={metrics.countSaudavel} color="border-green-600" textClass="text-green-600" />
                <KpiCard icon={<Clock size={20} />} label="Vencem Hoje" value={metrics.countHoje} color="border-orange-600" textClass="text-orange-600" />
              </div>
            </div>
          </section>

          {/* DISTRIBUIÇÃO E PARECER IA */}
          <section className="p-10 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-2 h-6 bg-black" />
                <h2 className="text-sm font-black tracking-[0.4em] uppercase text-black">Higiene Operacional</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatusPill label="Vencidos" count={metrics.countVencido} total={metrics.activeTotal} color="bg-red-600" />
                <StatusPill label="Hoje" count={metrics.countHoje} total={metrics.activeTotal} color="bg-orange-500" />
                <StatusPill label="Atenção" count={metrics.countAtencao} total={metrics.activeTotal} color="bg-amber-400" />
                <StatusPill label="No Prazo" count={metrics.countSaudavel} total={metrics.activeTotal} color="bg-green-600" />
                <StatusPill label="Sem Prazo" count={metrics.countSemPrazo} total={metrics.activeTotal} color="bg-slate-400" />
                <StatusPill label="Finalizados" count={metrics.countFinalizados} total={metrics.totalRepo} color="bg-black" />
              </div>
            </div>

            {iaInsights && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-6 bg-[#00D1FF]" />
                  <h2 className="text-sm font-black tracking-[0.4em] uppercase text-black">Parecer da Unidade Neural</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#fafafa] border-2 border-black p-10 shadow-[8px_8px_0px_#000]">
                   <div className="space-y-6">
                      <p className="text-[11px] font-black text-green-700 uppercase tracking-[0.2em] flex items-center gap-2"><TrendingUp size={16}/> Pontos Fortes e Vantagens</p>
                      <ul className="space-y-3">
                        {iaInsights.pontosFortes?.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs leading-relaxed text-black font-black uppercase bg-white border border-black/5 p-3 italic">" {item} "</li>
                        ))}
                      </ul>
                   </div>
                   <div className="space-y-6">
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-2"><TrendingDown size={16}/> Riscos e Pendências Críticas</p>
                      <ul className="space-y-3">
                        {iaInsights.riscosDetectados?.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs leading-relaxed text-black font-black uppercase bg-white border border-black/5 p-3 italic">" {item} "</li>
                        ))}
                      </ul>
                   </div>
                </div>
              </div>
            )}
          </section>

          {/* TRIAGEM DE PRIORIDADE MÁXIMA */}
          <section className="p-10 space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-2 h-6 bg-red-600" />
                <h2 className="text-sm font-black tracking-[0.4em] uppercase text-black">Lista de Intervenção Imediata</h2>
              </div>
              <Badge className="bg-black text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-none">Top 50 Críticos</Badge>
            </div>
            
            <div className="border-2 border-black overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f3f2f2] border-b-2 border-black">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black/60">Conta / Tribunal</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black/60">Protocolo</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black/60">Prazo</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black/60">Atraso</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black/60 text-right">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/5 bg-white">
                  {prioritaryCases.length > 0 ? prioritaryCases.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-black uppercase leading-tight">{c.cliente}</p>
                        <p className="text-[9px] text-black/40 font-black uppercase mt-1 tracking-widest">{c.tribunal || "TJSP"}</p>
                      </td>
                      <td className="px-6 py-4"><p className="text-[10px] font-mono font-bold text-black/50">{c.protocolo}</p></td>
                      <td className="px-6 py-4"><p className="text-xs font-black text-black">{c.proximoPrazo}</p></td>
                      <td className="px-6 py-4">
                        <p className={cn(
                          "text-[10px] font-black uppercase",
                          (c.diasFaltando || 0) < 0 ? "text-red-600" : "text-black/60"
                        )}>
                          {(c.diasFaltando || 0) < 0 ? `${Math.abs(c.diasFaltando || 0)} dias` : (c.diasFaltando === 0 ? "Hoje" : `${c.diasFaltando} dias`)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-block px-3 py-1 text-[9px] font-black tracking-widest uppercase border-2",
                          c.status === 'Vencido' ? "bg-red-50 text-red-600 border-red-600" : 
                          c.status === 'É Hoje' ? "bg-orange-50 text-orange-600 border-orange-600" : 
                          "bg-amber-50 text-amber-600 border-amber-600"
                        )}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-black/20 font-black uppercase italic">Nenhuma pendência crítica localizada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* FOOTER DE ASSINATURA */}
          <footer className="p-10 border-t-2 border-black bg-[#fafafa]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 border-2 border-black flex items-center justify-center bg-white shadow-[4px_4px_0px_#00D1FF]"><Zap size={24} className="text-black" /></div>
                <div>
                  <p className="text-[11px] font-black uppercase text-black tracking-widest">© 2026 W1 Capital</p>
                  <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">Advanced Monitoring Systems</p>
                </div>
              </div>
              <div className="flex flex-col items-center lg:items-end gap-3">
                <div className="h-0.5 w-64 bg-black" />
                <p className="text-[10px] font-black uppercase text-black tracking-[0.3em]">Selado por Davi Alves Figueredo</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { 
            background-color: white !important; 
            color: black !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .max-w-6xl { max-width: 100% !important; margin: 0 !important; }
          .bg-white { background-color: white !important; }
          .bg-[#f3f2f2] { background-color: #f3f2f2 !important; }
          .bg-[#fafafa] { background-color: #fafafa !important; }
          .border-black { border-color: black !important; }
          .shadow-[12px_12px_0px_#000] { box-shadow: none !important; }
          .shadow-[6px_6px_0px_#000] { box-shadow: none !important; }
          .shadow-[8px_8px_0px_#000] { box-shadow: none !important; }
          @page { size: A4; margin: 10mm; }
          .print-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ icon, label, value, color, textClass = "text-black" }: { icon: React.ReactNode; label: string; value: number | string; color: string; textClass?: string; }) {
  return (
    <div className={cn("bg-white border-2 p-6 flex flex-col justify-between min-h-[160px] shadow-[4px_4px_0px_#000]", color)}>
      <div className="mb-4 text-black">{icon}</div>
      <div>
        <p className={cn("text-4xl font-black tracking-tighter tabular-nums", textClass)}>{value}</p>
        <p className="text-[9px] tracking-widest uppercase text-black/40 font-black mt-2 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function StatusPill({ label, count, total, color }: { label: string; count: number; total: number; color: string; }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-white border-2 border-black p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">{label}</span>
        <span className="text-lg font-black text-black tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-[#f3f2f2] border border-black overflow-hidden rounded-none">
        <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[8px] font-black text-black/60 text-right tabular-nums">{pct}%</p>
    </div>
  );
}
