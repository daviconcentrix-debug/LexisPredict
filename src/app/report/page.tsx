
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LegalCase, CaseNote } from "@/lib/case-logic";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  Activity,
  Copyright,
  Edit3,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Scale,
  FileText,
  Zap,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { fetchRepoCases, fetchRepoNotes } from "@/app/actions/case-actions";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export default function UnifiedReport() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [customComment, setCustomComment] = useState("");
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        const [casesData, notesData] = await Promise.all([
          fetchRepoCases(),
          fetchRepoNotes(),
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
    const statusCounts = {
      Vencido: 0,
      Atenção: 0,
      "No Prazo": 0,
      Arquivado: 0,
      "Sem Prazo": 0,
      "É Hoje": 0,
      "Caso Crítico": 0,
      Encerrado: 0,
    };
    const tribunalCounts: Record<string, number> = {};

    cases.forEach((c) => {
      const situacao = (c.situacao || "").toUpperCase();
      const isArchived = ["ENCERRADO", "SUSPENSO", "ARQUIVADO", "EXTINTO"].some((s) =>
        situacao.includes(s)
      );

      // Agrupa arquivados e casos sem prazo conforme solicitado
      if (isArchived || c.status === 'Sem Prazo') {
        statusCounts["Sem Prazo"]++;
      } else {
        const status = c.status || "Sem Prazo";
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status as keyof typeof statusCounts]++;
        } else {
          statusCounts["Sem Prazo"]++;
        }
      }
      tribunalCounts[c.tribunal || "Outros"] =
        (tribunalCounts[c.tribunal || "Outros"] || 0) + 1;
    });

    const criticalCount =
      statusCounts.Vencido +
      statusCounts["É Hoje"] +
      statusCounts["Caso Crítico"];

    const attentionCount = statusCounts.Atenção;
    const healthyCount =
      statusCounts["No Prazo"];
    const archivedCount = statusCounts["Sem Prazo"];

    const topTribunals = Object.entries(tribunalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Risk score 0-100 (higher = more dangerous)
    const riskScore =
      total === 0
        ? 0
        : Math.min(
            100,
            Math.round(
              ((criticalCount * 40 + attentionCount * 15) / Math.max(total, 1)) *
                2.2
            )
          );

    return {
      total,
      statusCounts,
      criticalCount,
      attentionCount,
      healthyCount,
      archivedCount,
      topTribunals,
      riskScore,
    };
  }, [cases]);

  const handleExportPDF = () => {
    try {
      window.print();
    } catch (e) {
      alert(
        "Use o atalho do teclado:\n• Windows/Linux: Ctrl + P\n• Mac: Cmd + P\n\nDepois escolha 'Salvar como PDF'."
      );
    }
  };

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-[#c9a227]/30 border-t-[#c9a227] rounded-full animate-spin" />
          <Scale className="absolute inset-0 m-auto text-[#c9a227]" size={22} />
        </div>
        <p className="font-light tracking-[0.4em] text-[11px] text-[#c9a227] uppercase">
          Compilando Dossiê Estratégico
        </p>
      </div>
    );
  }

  const highRiskCases = cases
    .filter((c) =>
      ["Vencido", "É Hoje", "Caso Crítico", "Atenção"].includes(c.status)
    )
    .slice(0, 40);

  const riskLabel =
    metrics.riskScore >= 70
      ? "CRÍTICO"
      : metrics.riskScore >= 40
      ? "ELEVADO"
      : metrics.riskScore >= 20
      ? "MODERADO"
      : "CONTROLADO";

  const riskColor =
    metrics.riskScore >= 70
      ? "text-red-500"
      : metrics.riskScore >= 40
      ? "text-orange-400"
      : metrics.riskScore >= 20
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#c9a227]/30">
      {/* ========== TOP BAR (hidden on print) ========== */}
      <div className="print:hidden sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            asChild
            className="text-white/70 hover:text-white hover:bg-white/5 font-medium tracking-wide text-xs uppercase rounded-none h-10 px-4"
          >
            <Link href="/">
              <ArrowLeft size={14} className="mr-2" /> Voltar ao Gabinete
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/40 uppercase">
              <Eye size={12} /> Modo Executivo
            </div>
            <Button
              onClick={handleExportPDF}
              className="bg-[#c9a227] hover:bg-[#d4af37] text-black font-bold uppercase text-[10px] tracking-widest h-11 px-7 rounded-none transition-all"
            >
              <Printer size={14} className="mr-2" /> Exportar PDF Forense
            </Button>
          </div>
        </div>
      </div>

      {/* ========== PARECER (only on screen) ========== */}
      <div className="print:hidden max-w-6xl mx-auto px-6 pt-8">
        <div className="bg-white/[0.03] border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Edit3 size={14} className="text-[#c9a227]" />
            <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#c9a227]">
              Parecer do Auditor (Opcional)
            </span>
          </div>
          <Textarea
            placeholder="Digite aqui observações estratégicas que aparecerão no final do dossiê..."
            value={customComment}
            onChange={(e) => setCustomComment(e.target.value)}
            className="min-h-[90px] bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-none focus-visible:ring-1 focus-visible:ring-[#c9a227] focus-visible:border-[#c9a227] text-sm"
          />
        </div>
      </div>

      {/* ========== MAIN DOSSIER ========== */}
      <div className="max-w-6xl mx-auto px-6 py-10 print:px-0 print:py-0">
        <div className="bg-[#111111] border border-white/10 print:border-0 print:bg-white print:text-black shadow-2xl">
          
          {/* ===== HEADER PREMIUM ===== */}
          <header className="relative overflow-hidden">
            {/* Gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
            
            <div className="px-10 pt-12 pb-10 flex flex-col lg:flex-row justify-between gap-8">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-[#c9a227] flex items-center justify-center">
                    <Scale size={16} className="text-[#c9a227]" />
                  </div>
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#c9a227] font-medium">
                    W1 Capital • Advanced Legal Ops
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] text-white print:text-black">
                  DOSSIÊ<br />
                  <span className="text-[#c9a227]">ESTRATÉGICO</span>
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="px-3 py-1.5 bg-[#c9a227] text-black text-[10px] font-bold tracking-widest uppercase">
                    {profile?.empresa_id || "CONFIDENTIAL"}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/50 print:text-black/60">
                    <Calendar size={12} />
                    {new Date().toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Auditor block */}
              <div className="text-right space-y-2 self-end">
                <p className="text-sm font-medium tracking-wide text-white print:text-black">
                  {profile?.nome || "DAVI ALVES FIGUEREDO"}
                </p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 print:text-black/50">
                  {profile?.cargo || "Administrador de Auditoria"}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 border border-emerald-500/40 text-emerald-400 text-[9px] font-medium tracking-widest uppercase">
                  <ShieldCheck size={11} /> Sistema Autenticado
                </div>
              </div>
            </div>
          </header>

          {/* ===== EXECUTIVE SNAPSHOT (the "everything at a glance" zone) ===== */}
          <section className="px-10 pb-10">
            <div className="grid grid-cols-12 gap-4">
              
              {/* RISK SCORE - Big dominant card */}
              <div className="col-span-12 md:col-span-4 bg-black border border-white/10 p-7 flex flex-col justify-between min-h-[200px] print:border-black/20">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4">
                    Índice de Risco
                  </p>
                  <div className="flex items-end gap-3">
                    <span className={cn("text-6xl font-black tracking-tighter leading-none", riskColor)}>
                      {metrics.riskScore}
                    </span>
                    <span className="text-white/30 text-lg font-light mb-2">/100</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className={cn("text-xs font-bold tracking-[0.2em] uppercase", riskColor)}>
                    {riskLabel}
                  </span>
                  <div className="h-1.5 flex-1 mx-4 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        metrics.riskScore >= 70
                          ? "bg-red-500"
                          : metrics.riskScore >= 40
                          ? "bg-orange-400"
                          : metrics.riskScore >= 20
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      )}
                      style={{ width: `${metrics.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 4 KPI cards */}
              <div className="col-span-12 md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon={<FileText size={16} />}
                  label="Total sob Gestão"
                  value={metrics.total}
                  accent="text-white"
                />
                <KpiCard
                  icon={<AlertTriangle size={16} />}
                  label="Alertas Críticos"
                  value={metrics.criticalCount}
                  accent="text-red-400"
                  highlight={metrics.criticalCount > 0}
                />
                <KpiCard
                  icon={<Clock size={16} />}
                  label="Em Atenção"
                  value={metrics.attentionCount}
                  accent="text-orange-400"
                />
                <KpiCard
                  icon={<CheckCircle2 size={16} />}
                  label="Saudáveis"
                  value={metrics.healthyCount}
                  accent="text-emerald-400"
                />
              </div>
            </div>
          </section>

          {/* ===== STATUS DISTRIBUTION (visual bars) ===== */}
          <section className="px-10 pb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-5 bg-[#c9a227]" />
              <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60 print:text-black/60">
                Distribuição de Status
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatusPill
                label="Crítico / Vencido"
                count={metrics.criticalCount}
                total={metrics.total}
                color="bg-red-500"
              />
              <StatusPill
                label="Atenção"
                count={metrics.attentionCount}
                total={metrics.total}
                color="bg-orange-400"
              />
              <StatusPill
                label="No Prazo"
                count={metrics.healthyCount}
                total={metrics.total}
                color="bg-emerald-400"
              />
              <StatusPill
                label="Sem Prazo / Finalizados"
                count={metrics.archivedCount}
                total={metrics.total}
                color="bg-white/30"
              />
            </div>
          </section>

          {/* ===== CRITICAL CASES TABLE ===== */}
          <section className="px-10 pb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-red-500" />
                <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60 print:text-black/60">
                  Triagem de Prioridade Máxima
                </h2>
              </div>
              <span className="text-[10px] text-white/30 tracking-widest uppercase">
                {highRiskCases.length} registros
              </span>
            </div>

            <div className="border border-white/10 print:border-black/20 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] print:bg-black/[0.03]">
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 print:text-black/50 border-b border-white/10 print:border-black/10">
                      Cliente
                    </th>
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 print:text-black/50 border-b border-white/10 print:border-black/10">
                      Protocolo
                    </th>
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 print:text-black/50 border-b border-white/10 print:border-black/10">
                      Prazo
                    </th>
                    <th className="px-5 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/40 print:text-black/50 border-b border-white/10 print:border-black/10 text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskCases.length > 0 ? (
                    highRiskCases.map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 print:border-black/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-white print:text-black leading-tight">
                            {c.cliente}
                          </p>
                          <p className="text-[10px] text-white/30 print:text-black/40 mt-0.5">
                            {c.tribunal || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[11px] font-mono text-white/60 print:text-black/60">
                            {c.protocolo || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-white/80 print:text-black/80">
                            {c.proximoPrazo || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={cn(
                              "inline-block px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase",
                              ["Vencido", "É Hoje", "Caso Crítico"].includes(
                                c.status
                              )
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            )}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-16 text-center text-white/20 print:text-black/30 text-sm tracking-wide"
                      >
                        Nenhum caso de alta prioridade no momento
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ===== TRIBUNALS + NOTES ===== */}
          <section className="px-10 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Tribunals */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 bg-[#c9a227]" />
                <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60 print:text-black/60">
                  Distribuição por Tribunal
                </h2>
              </div>
              <div className="space-y-4">
                {metrics.topTribunals.length > 0 ? (
                  metrics.topTribunals.map(([name, count]) => {
                    const pct = metrics.total
                      ? Math.round((count / metrics.total) * 100)
                      : 0;
                    return (
                      <div key={name} className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium text-white print:text-black">
                            {name}
                          </span>
                          <span className="text-white/40 print:text-black/50 tabular-nums">
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-white/10 print:bg-black/10 overflow-hidden">
                          <div
                            className="h-full bg-[#c9a227]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-white/30 text-sm">Sem dados</p>
                )}
              </div>
            </div>

            {/* Notes / Evidence */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 bg-[#c9a227]" />
                <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60 print:text-black/60">
                  Evidências Recentes
                </h2>
              </div>
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.slice(0, 100).map((note) => (
                    <div
                      key={note.id}
                      className="p-4 border border-white/10 print:border-black/15 bg-white/[0.02] break-inside-avoid"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-medium text-white print:text-black truncate max-w-[70%]">
                          {note.title}
                        </p>
                        <span className="text-[9px] text-white/30 print:text-black/40">
                          {note.updatedAt}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 print:text-black/60 leading-relaxed">
                        {note.content}
                      </p>
                      {note.imageUrl && (
                        <div className="mt-3 border border-white/10 overflow-hidden">
                           <img src={note.imageUrl} alt="Evidência" className="w-full h-auto max-h-64 object-contain" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full min-h-[140px] border border-dashed border-white/10 print:border-black/15 flex items-center justify-center">
                  <p className="text-[11px] text-white/25 print:text-black/30 tracking-widest uppercase">
                    Nenhuma evidência registrada
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ===== CUSTOM PARECER ===== */}
          {customComment && (
            <section className="mx-10 mb-12 p-8 bg-[#c9a227]/5 border border-[#c9a227]/20 print:bg-amber-50 print:border-amber-200 break-inside-avoid">
              <div className="flex items-center gap-2 mb-4">
                <Edit3 size={14} className="text-[#c9a227]" />
                <h3 className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#c9a227]">
                  Parecer Complementar do Auditor
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-white/80 print:text-black/80 italic">
                “{customComment}”
              </p>
            </section>
          )}

          {/* ===== FOOTER SEAL ===== */}
          <footer className="px-10 py-10 border-t border-white/10 print:border-black/15">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-[#c9a227]/50 flex items-center justify-center">
                  <Zap size={16} className="text-[#c9a227]" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 print:text-black/50">
                    2026 W1 Capital
                  </p>
                  <p className="text-xs text-white/60 print:text-black/60 font-medium">
                    Advanced Legal Operations
                  </p>
                </div>
              </div>

              <div className="text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 print:border-black/30">
                  <ShieldCheck size={13} className="text-[#c9a227]" />
                  <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70 print:text-black/70">
                    Selado por {profile?.nome || "Davi Alves Figueredo"}
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ========== Sub-components ========== */

function KpiCard({
  icon,
  label,
  value,
  accent,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-black border p-5 flex flex-col justify-between min-h-[140px] print:border-black/20",
        highlight ? "border-red-500/40" : "border-white/10"
      )}
    >
      <div className={cn("mb-4", accent)}>{icon}</div>
      <div>
        <p className="text-3xl font-black tracking-tighter text-white print:text-black tabular-nums">
          {value}
        </p>
        <p className="text-[9px] tracking-[0.15em] uppercase text-white/40 print:text-black/50 mt-1.5 leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}

function StatusPill({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-black/50 border border-white/10 print:border-black/15 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-wide text-white/50 print:text-black/50 uppercase">
          {label}
        </span>
        <span className="text-lg font-black text-white print:text-black tabular-nums">
          {count}
        </span>
      </div>
      <div className="h-1 w-full bg-white/10 print:bg-black/10 overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[9px] text-white/30 print:text-black/40 mt-2 tabular-nums">
        {pct}% da carteira
      </p>
    </div>
  );
}
