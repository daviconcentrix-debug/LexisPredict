
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  FileText, 
  Copyright, 
  Scale, 
  StickyNote,
  Edit3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { fetchRepoCases, fetchRepoNotes } from '@/app/actions/case-actions';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function UnifiedReport() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [customComment, setCustomComment] = useState('');
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
      } catch (e) {
        console.error("Report extraction failure:", e);
      } finally {
        setLoading(false);
      }
    }
    if (mounted && !authLoading) load();
  }, [mounted, authLoading]);

  const metrics = useMemo(() => {
    const total = cases.length;
    const statusCounts = { Vencido: 0, Atenção: 0, 'No Prazo': 0, Arquivado: 0, 'Sem Prazo': 0, 'É Hoje': 0, 'Caso Crítico': 0, 'Encerrado': 0 };
    const tribunalCounts: Record<string, number> = {};

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
      tribunalCounts[c.tribunal || 'Outros'] = (tribunalCounts[c.tribunal || 'Outros'] || 0) + 1;
    });

    const criticalCount = statusCounts.Vencido + statusCounts['É Hoje'] + statusCounts['Caso Crítico'];
    const topTribunals = Object.entries(tribunalCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return { total, statusCounts, criticalCount, topTribunals };
  }, [cases]);

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <Activity className="animate-spin text-black" size={32} />
        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Compilando Dossiê Estratégico...</p>
      </div>
    );
  }

  const highRiskCases = cases.filter(c => ['Vencido', 'É Hoje', 'Caso Crítico', 'Atenção'].includes(c.status)).slice(0, 50);

  return (
    <div className="min-h-screen bg-[#f8f9fb] p-8 md:p-16 max-w-5xl mx-auto print:p-0 print:bg-white print:max-w-none font-sans text-black relative">
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center mb-12 print:hidden">
        <Button variant="ghost" asChild className="font-black uppercase text-[10px] hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded-none">
          <Link href="/"><ArrowLeft size={14} className="mr-2" /> Voltar</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-black text-white font-black uppercase text-[10px] h-12 px-10 rounded-none shadow-[6px_6px_0px_#ddd] hover:shadow-none transition-all">
          <Printer size={16} className="mr-2" /> Exportar PDF Forense
        </Button>
      </div>

      {/* PARECER TÉCNICO INPUT */}
      <section className="mb-12 p-6 bg-white border-2 border-dashed border-black/10 space-y-4 print:hidden">
        <div className="flex items-center gap-2">
           <Edit3 size={16} />
           <p className="text-[10px] font-black uppercase tracking-widest">Parecer do Auditor (Opcional)</p>
        </div>
        <Textarea 
          placeholder="INSIRA AQUI AS OBSERVAÇÕES ESTRATÉGICAS PARA O RELATÓRIO..."
          value={customComment}
          onChange={(e) => setCustomComment(e.target.value)}
          className="min-h-[100px] border-2 border-black/5 rounded-none font-black uppercase text-[10px] focus-visible:ring-0 focus-visible:border-black"
        />
      </section>

      {/* OFFICIAL REPORT CONTENT */}
      <div className="report-canvas bg-white shadow-2xl border-t-[16px] border-black p-12 print:shadow-none print:border-t-[8px]">
        <header className="flex justify-between items-start border-b-2 border-black pb-10 mb-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Relatório Jurídico Consolidado</h1>
            <div className="flex items-center gap-4">
               <Badge className="bg-black text-white font-black rounded-none px-3 py-1 uppercase text-[10px]">{profile?.empresa_id || "W1 CAPITAL"}</Badge>
               <span className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2"><Calendar size={12}/> {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs font-black uppercase">{profile?.nome || "GABINETE TÉCNICO"}</p>
             <p className="text-[9px] font-black uppercase opacity-40">{profile?.cargo || "OPERADOR"} DE AUDITORIA</p>
             <div className="mt-4 flex items-center justify-end gap-1.5 text-[9px] font-black uppercase text-green-600">
                <ShieldCheck size={12} /> AUTHENTICATED SYSTEM
             </div>
          </div>
        </header>

        {/* SECTION 1: KPIS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <MetricCard label="Total sob Gestão" value={metrics.total} color="border-black" />
          <MetricCard label="Alertas Críticos" value={metrics.criticalCount} color="border-red-600" textColor="text-red-600" />
          <MetricCard label="Em Atenção" value={metrics.statusCounts.Atenção} color="border-orange-500" textColor="text-orange-500" />
          <MetricCard label="Saudáveis" value={metrics.statusCounts['No Prazo'] + metrics.statusCounts['Sem Prazo']} color="border-green-600" textColor="text-green-600" />
        </section>

        {/* SECTION 2: CASOS CRÍTICOS */}
        <section className="mb-16">
           <div className="flex items-center gap-3 mb-6 border-l-[10px] border-black pl-4">
              <h2 className="text-xl font-black uppercase tracking-tight">Triagem de Casos Críticos</h2>
           </div>
           <div className="border-2 border-black overflow-hidden">
              <table className="w-full text-left text-[9px] font-black uppercase border-collapse">
                <thead className="bg-[#f3f2f2] border-b-2 border-black">
                  <tr>
                    <th className="px-6 py-4 border-r border-black/10">Cliente / Protocolo</th>
                    <th className="px-6 py-4 border-r border-black/10">Próximo Prazo</th>
                    <th className="px-6 py-4">Status Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/5">
                  {highRiskCases.length > 0 ? highRiskCases.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 border-r border-black/10">
                        <p className="leading-tight">{c.cliente}</p>
                        <p className="text-[8px] opacity-40 mt-1 font-mono">{c.protocolo}</p>
                      </td>
                      <td className="px-6 py-4 border-r border-black/10">{c.proximoPrazo || 'S/ Registro'}</td>
                      <td className="px-6 py-4">
                         <span className={cn(
                           "px-2 py-0.5 rounded-none text-[8px]",
                           ['Vencido', 'É Hoje', 'Caso Crítico'].includes(c.status) ? "bg-red-600 text-white" : "bg-orange-500 text-white"
                         )}>{c.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="px-6 py-20 text-center italic opacity-30">Nenhum registro de alta prioridade localizado.</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </section>

        {/* SECTION 3: TRIBUNALS & ANALYTICS */}
        <section className="mb-16 break-inside-avoid">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                 <div className="flex items-center gap-3 mb-6 border-l-[10px] border-black pl-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">Distribuição por Tribunal</h2>
                 </div>
                 <div className="space-y-4">
                    {metrics.topTribunals.map(([name, count]) => {
                      const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                      return (
                        <div key={name} className="space-y-1">
                           <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                              <span>{name}</span>
                              <span>{count} ({pct}%)</span>
                           </div>
                           <div className="h-2 w-full bg-[#f3f2f2] border border-black/5">
                              <div className="h-full bg-black" style={{ width: `${pct}%` }} />
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
              <div className="flex flex-col justify-center items-center text-center p-8 bg-[#f3f2f2] border-4 border-dashed border-black/10 space-y-4">
                 <ShieldCheck size={48} className="opacity-20" />
                 <p className="text-[10px] font-black uppercase leading-relaxed tracking-widest">
                    Este documento é uma representação fidedigna do banco de dados cloud W1 Capital sob a jurisdição do auditor logado.
                 </p>
              </div>
           </div>
        </section>

        {/* SECTION 4: EVIDÊNCIAS */}
        {notes.length > 0 && (
          <section className="mb-16 break-inside-avoid">
            <div className="flex items-center gap-3 mb-8 border-l-[10px] border-black pl-4">
              <h2 className="text-xl font-black uppercase tracking-tight">Log de Evidências & Notas</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
               {notes.slice(0, 10).map((note) => (
                 <div key={note.id} className="p-5 border-2 border-black space-y-4 break-inside-avoid">
                    <div className="flex justify-between items-start border-b border-black/10 pb-2">
                       <h3 className="text-[10px] font-black uppercase max-w-[70%]">{note.title}</h3>
                       <span className="text-[8px] font-black opacity-40">{note.updatedAt}</span>
                    </div>
                    <p className="text-[9px] font-black uppercase leading-relaxed text-black/60">{note.content}</p>
                    {note.imageUrl && (
                      <div className="border-2 border-black grayscale">
                         <img src={note.imageUrl} alt="Anexo" className="w-full h-32 object-cover" />
                      </div>
                    )}
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* CUSTOM PARECER FOOTER */}
        {customComment && (
          <section className="mt-16 p-10 bg-black text-white space-y-4 break-inside-avoid">
             <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-primary" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Parecer Complementar</h3>
             </div>
             <p className="text-sm font-black uppercase leading-loose italic">{customComment}</p>
          </section>
        )}

        <footer className="mt-20 pt-10 border-t-4 border-black text-center space-y-6">
           <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em]">
              <Copyright size={10} /> 2026 W1 CAPITAL • ADVANCED LEGAL OPS
           </div>
           <div className="inline-block px-12 py-4 border-2 border-black bg-white shadow-[8px_8px_0px_#f3f2f2]">
              <p className="text-xs font-black uppercase tracking-tighter">Relatório Selado e Auditado por Davi Alves Figueredo</p>
           </div>
        </footer>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .report-canvas { border: none !important; box-shadow: none !important; p-0 !important; }
          @page { size: A4; margin: 20mm; }
          .print-hidden { display: none !important; }
        }
        .report-canvas {
          background-image: radial-gradient(#000 0.5px, transparent 0.5px);
          background-size: 30px 30px;
          background-position: center;
          background-attachment: local;
        }
        .report-canvas > * {
          position: relative;
          z-index: 1;
        }
        .report-canvas::before {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0.96;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}

function MetricCard({ label, value, color, textColor = "text-black" }: { label: string, value: number, color: string, textColor?: string }) {
  return (
    <div className={cn("p-6 border-2 text-center space-y-2 rounded-none bg-white", color)}>
       <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">{label}</p>
       <p className={cn("text-4xl font-black leading-none", textColor)}>{value}</p>
    </div>
  );
}
