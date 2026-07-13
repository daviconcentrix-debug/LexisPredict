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
  FileText,
  Copyright,
  Scale,
  StickyNote,
  Edit3,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { fetchRepoCases, fetchRepoNotes } from "@/app/actions/case-actions";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
      const isArchived = ["ENCERRADO", "SUSPENSO", "ARQUIVADO"].some((s) =>
        situacao.includes(s)
      );

      if (isArchived) {
        statusCounts.Arquivado++;
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
    const topTribunals = Object.entries(tribunalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { total, statusCounts, criticalCount, topTribunals };
  }, [cases]);

  const handleExportPDF = () => {
    try {
      window.print();
    } catch (e) {
      alert(
        "O ambiente de preview bloqueou a impressão automática.\n\nUse o atalho do teclado:\n• Windows/Linux: Ctrl + P\n• Mac: Cmd + P\n\nDepois escolha 'Salvar como PDF' no destino."
      );
    }
  };

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <Activity className="animate-spin text-black" size={32} />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-black">
          Compilando Dossiê Estratégico...
        </p>
      </div>
    );
  }

  const highRiskCases = cases
    .filter((c) =>
      ["Vencido", "É Hoje", "Caso Crítico", "Atenção"].includes(c.status)
    )
    .slice(0, 50);

  return (
    <div className="min-h-screen bg-[#f8f9fb] p-6 md:p-12 max-w-5xl mx-auto print:p-0 print:bg-white print:max-w-none font-sans text-black relative">
      {/* ==================== CONTROLES SUPERIORES (FORÇA VISIBILIDADE) ==================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <Button
          variant="outline"
          asChild
          className="font-black uppercase text-[10px] border-2 border-black text-black hover:bg-black hover:text-white rounded-none h-11 px-6 bg-white"
        >
          <Link href="/">
            <ArrowLeft size={14} className="mr-2" /> Painel Principal
          </Link>
        </Button>

        <Button
          onClick={handleExportPDF}
          className="bg-black text-white font-black uppercase text-[10px] h-12 px-8 rounded-none shadow-[6px_6px_0px_#d1d5db] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-black"
        >
          <Printer size={16} className="mr-2" /> Exportar PDF Forense
        </Button>
      </div>

      {/* ==================== PARECER DO AUDITOR (CONTRASTE AAA) ==================== */}
      <section className="mb-10 p-6 bg-white border-2 border-black space-y-4 print:hidden shadow-[4px_4px_0px_#000]">
        <div className="flex items-center gap-2">
          <Edit3 size={18} className="text-black" />
          <p className="text-[11px] font-black uppercase tracking-widest text-black">
            Parecer do Auditor (Inclusão Estratégica)
          </p>
        </div>
        <Textarea
          placeholder="INSIRA AQUI AS OBSERVAÇÕES ESTRATÉGICAS QUE DEVEM CONSTAR NO RELATÓRIO OFICIAL..."
          value={customComment}
          onChange={(e) => setCustomComment(e.target.value)}
          className="min-h-[110px] border-2 border-black rounded-none font-medium text-sm text-black placeholder:text-black/40 focus-visible:ring-0 focus-visible:border-black bg-white"
        />
        <p className="text-[9px] text-black/60 font-black uppercase tracking-widest">
          O texto inserido acima aparecerá na seção final do documento impresso.
        </p>
      </section>

      {/* ==================== CONTEÚDO OFICIAL DO RELATÓRIO ==================== */}
      <div className="report-canvas bg-white shadow-2xl border-t-[16px] border-black p-8 md:p-12 print:shadow-none print:border-t-[8px]">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start border-b-2 border-black pb-8 mb-10 gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none text-black">
              Relatório Jurídico Consolidado
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-black text-white font-black rounded-none px-3 py-1 uppercase text-[10px]">
                {profile?.empresa_id || "W1 CAPITAL"}
              </Badge>
              <span className="text-[10px] font-black uppercase text-black/50 flex items-center gap-2">
                <Calendar size={12} />{" "}
                {new Date().toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase text-black">
              {profile?.nome || "GABINETE TÉCNICO"}
            </p>
            <p className="text-[9px] font-black uppercase text-black/50">
              {profile?.cargo || "OPERADOR"} DE AUDITORIA
            </p>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[9px] font-black uppercase text-emerald-600">
              <ShieldCheck size={12} /> AUTHENTICATED SYSTEM
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <MetricCard
            label="Total sob Gestão"
            value={metrics.total}
            color="border-black"
          />
          <MetricCard
            label="Alertas Críticos"
            value={metrics.criticalCount}
            color="border-red-600"
            textColor="text-red-600"
          />
          <MetricCard
            label="Em Atenção"
            value={metrics.statusCounts.Atenção}
            color="border-orange-500"
            textColor="text-orange-500"
          />
          <MetricCard
            label="Saudáveis"
            value={
              metrics.statusCounts["No Prazo"] + metrics.statusCounts["Sem Prazo"]
            }
            color="border-emerald-600"
            textColor="text-emerald-600"
          />
        </section>

        {/* CASOS CRÍTICOS */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5 border-l-[10px] border-black pl-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Triagem de Casos Críticos
            </h2>
          </div>
          <div className="border-2 border-black overflow-hidden">
            <table className="w-full text-left text-[9px] font-black uppercase border-collapse">
              <thead className="bg-[#f3f2f2] border-b-2 border-black">
                <tr>
                  <th className="px-5 py-3 border-r border-black/10 text-black">
                    Cliente / Protocolo
                  </th>
                  <th className="px-5 py-3 border-r border-black/10 text-black">
                    Próximo Prazo
                  </th>
                  <th className="px-5 py-3 text-black">Status Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/5">
                {highRiskCases.length > 0 ? (
                  highRiskCases.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 border-r border-black/10">
                        <p className="leading-tight text-black">{c.cliente}</p>
                        <p className="text-[8px] text-black/40 mt-1 font-mono">
                          {c.protocolo}
                        </p>
                      </td>
                      <td className="px-5 py-3 border-r border-black/10 text-black">
                        {c.proximoPrazo || "S/ Registro"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-none text-[8px] font-black",
                            ["Vencido", "É Hoje", "Caso Crítico"].includes(
                              c.status
                            )
                              ? "bg-red-600 text-white"
                              : "bg-orange-500 text-white"
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
                      colSpan={3}
                      className="px-5 py-16 text-center italic text-black/30"
                    >
                      Nenhum registro de alta prioridade localizado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* TRIBUNAIS */}
        <section className="mb-12 break-inside-avoid">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-5 border-l-[10px] border-black pl-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">
                  Distribuição por Tribunal
                </h2>
              </div>
              <div className="space-y-4">
                {metrics.topTribunals.map(([name, count]) => {
                  const pct = metrics.total
                    ? Math.round((count / metrics.total) * 100)
                    : 0;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-black">
                        <span>{name}</span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#f3f2f2] border border-black/10">
                        <div
                          className="h-full bg-black"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col justify-center items-center text-center p-8 bg-[#f3f2f2] border-4 border-dashed border-black/20 space-y-4">
              <ShieldCheck size={48} className="text-black/20" />
              <p className="text-[10px] font-black uppercase leading-relaxed tracking-widest text-black/60">
                Este documento é uma representação fidedigna do banco de dados
                sob a jurisdição do auditor logado.
              </p>
            </div>
          </div>
        </section>

        {/* EVIDÊNCIAS */}
        {notes.length > 0 && (
          <section className="mb-12 break-inside-avoid">
            <div className="flex items-center gap-3 mb-6 border-l-[10px] border-black pl-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                Log de Evidências & Notas
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {notes.slice(0, 10).map((note) => (
                <div
                  key={note.id}
                  className="p-5 border-2 border-black space-y-3 break-inside-avoid"
                >
                  <div className="flex justify-between items-start border-b border-black/10 pb-2">
                    <h3 className="text-[10px] font-black uppercase max-w-[70%] text-black">
                      {note.title}
                    </h3>
                    <span className="text-[8px] font-black text-black/40">
                      {note.updatedAt}
                    </span>
                  </div>
                  <p className="text-[9px] font-medium uppercase leading-relaxed text-black/70">
                    {note.content}
                  </p>
                  {note.imageUrl && (
                    <div className="border-2 border-black">
                      <img
                        src={note.imageUrl}
                        alt="Anexo"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PARECER COMPLEMENTAR (só aparece se tiver texto) */}
        {customComment && (
          <section className="mt-12 p-8 bg-black text-white space-y-4 break-inside-avoid shadow-[10px_10px_0px_#facc15]">
            <div className="flex items-center gap-2">
              <Edit3 size={16} className="text-[#facc15]" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                Parecer Complementar do Auditor
              </h3>
            </div>
            <p className="text-sm font-black uppercase leading-loose italic border-l-4 border-[#facc15] pl-6">
              {customComment}
            </p>
          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-16 pt-8 border-t-4 border-black text-center space-y-5">
          <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-black">
            <Copyright size={10} /> 2026 W1 CAPITAL • ADVANCED LEGAL OPS
          </div>
          <div className="inline-block px-10 py-3 border-2 border-black bg-white shadow-[6px_6px_0px_#e5e5e5]">
            <p className="text-xs font-black uppercase tracking-tighter text-black">
              Relatório Selado e Auditado por{" "}
              {profile?.nome || "Davi Alves Figueredo"}
            </p>
          </div>
        </footer>
      </div>

      {/* ESTILOS DE IMPRESSÃO PROFISSIONAIS */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .report-canvas {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          @page {
            size: A4;
            margin: 15mm;
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

function MetricCard({
  label,
  value,
  color,
  textColor = "text-black",
}: {
  label: string;
  value: number;
  color: string;
  textColor?: string;
}) {
  return (
    <div
      className={cn(
        "p-5 border-2 text-center space-y-2 rounded-none bg-white",
        color
      )}
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-black/50">
        {label}
      </p>
      <p className={cn("text-3xl md:text-4xl font-black leading-none", textColor)}>
        {value}
      </p>
    </div>
  );
}
