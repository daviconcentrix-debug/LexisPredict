
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
  TrendingUp,
  StickyNote,
  Sparkles,
  TrendingDown,
  Layout,
  Layers,
  FileCode,
  Download,
  Search,
  Users
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
    let riskColor = "text-emerald-400";
    if (riskScore > 80) { riskLabel = "CRÍTICO"; riskColor = "text-red-500"; }
    else if (riskScore > 60) { riskLabel = "ALTO"; riskColor = "text-orange-500"; }
    else if (riskScore > 40) { riskLabel = "ELEVADO"; riskColor = "text-yellow-500"; }
    else if (riskScore > 20) { riskLabel = "MODERADO"; riskColor = "text-amber-400"; }

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

  const filteredOmniCases = useMemo(() => {
    const q = omniSearch.toLowerCase();
    return cases.filter(c => 
      c.cliente.toLowerCase().includes(q) || 
      c.protocolo.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [cases, omniSearch]);

  const handleExportPDF = () => window.print();

  const handleExportOmniHTML = () => {
    const summaryText = iaInsights?.summary || iaInsights?.pontosFortes?.join(' ') || "Acompanhamento processual consolidado pelo sistema.";
    
    const dataForOmni = {
      stats: {
        total_cases: metrics.totalRepo,
        tribunais_unicos: new Set(cases.map(c => c.tribunal)).size,
        top_tribunal: metrics.topTribununal,
      },
      operational: cases.map(c => ({
        protocolo: c.protocolo,
        cliente: c.cliente,
        tribunal: c.tribunal,
        situacao: c.situacao,
        risco: c.risco,
        retornoRaw: c.ultimoRetorno,
        statusContato: c.status,
        proximo_prazo: c.proximoPrazo,
        alerta_visual: c.status === 'Vencido' || c.status === 'É Hoje' ? 'red' : (c.status === 'Atenção' ? 'gold' : 'green')
      })),
      insights: {
        summary: summaryText,
        indicators: iaInsights?.riscosDetectados?.join(' ') || "Nenhum risco crítico identificado pela unidade neural no período.",
        recommendations: iaInsights?.pontosFortes?.slice(0, 3) || []
      }
    };

    const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Dossiê Executivo Premium • OmniReport</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root{ --bg:#07111f; --bg2:#0c1d35; --panel:rgba(10,22,42,.74); --gold:#f5c35b; --text:#edf4ff; --muted:#9fb2cb; --radius:28px; }
    body{ background:linear-gradient(160deg, var(--bg), var(--bg2)); color:var(--text); font-family:'Inter', sans-serif; padding:30px; margin:0; overflow-x:hidden; }
    .shell{ max-width:1400px; margin:0 auto; position:relative; }
    .hero{ background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); border:1px solid rgba(255,255,255,.1); border-radius:30px; padding:40px; backdrop-filter:blur(20px); margin-bottom:30px; }
    .title{ font-family:'Space Grotesk', sans-serif; font-size:48px; font-weight:900; margin:0; letter-spacing:-2px; color:var(--gold); text-transform: uppercase; }
    .grid-kpi{ display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-top:30px; }
    .kpi{ background:rgba(255,255,255,.05); padding:20px; border-radius:20px; border:1px solid rgba(255,255,255,.1); text-align:center; }
    .kpi-v{ font-size:32px; font-weight:900; color:var(--gold); }
    .card{ background:var(--panel); border:1px solid rgba(255,255,255,.1); border-radius:30px; padding:25px; backdrop-filter:blur(15px); }
    .note-box{ background:#fdfaf3; color:#2c2c2c; border-radius:20px; padding:30px; border-left:8px solid var(--gold); margin:20px 0; font-weight: 700; font-size: 18px; text-transform: uppercase; }
    table{ width:100%; border-collapse:collapse; margin-top:20px; border-radius:15px; overflow:hidden; }
    th{ text-align:left; padding:15px; background:rgba(255,255,255,.1); font-size:11px; text-transform:uppercase; }
    td{ padding:15px; border-bottom:1px solid rgba(255,255,255,.05); font-size:13px; }
    .badge{ padding:5px 10px; border-radius:999px; font-size:10px; font-weight:900; text-transform:uppercase; }
    .badge.red{ background:rgba(255,0,0,0.1); color:#ff4d4d; border:1px solid #ff4d4d; }
    .badge.gold{ background:rgba(245,195,91,0.1); color:#f5c35b; border:1px solid #f5c35b; }
    .badge.green{ background:rgba(0,255,0,0.1); color:#4ade80; border:1px solid #4ade80; }
    .detail-panel{ position:fixed; right:-450px; top:0; height:100vh; width:450px; background:#0c1d35; border-left:2px solid var(--gold); transition:.4s; z-index:1000; padding:40px; overflow-y:auto; box-shadow:-20px 0 60px rgba(0,0,0,.5); }
    .detail-panel.open{ right:0; }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <h1 class="title">RELATÓRIO PREMIUM</h1>
      <p style="color:var(--muted)">Dossiê Operacional e Processual • ${new Date().toLocaleDateString('pt-BR')}</p>
      <div class="grid-kpi" id="kpi-grid"></div>
    </section>

    <div style="display:grid; grid-template-columns: 1.6fr .9fr; gap:25px;">
      <div>
        <section class="card">
          <h2 style="color:var(--gold); font-size:12px; font-weight:900; text-transform:uppercase;">Parecer do Gabinete</h2>
          <div class="note-box">${summaryText}</div>
        </section>
        <section class="card" style="margin-top:25px;">
          <h2 style="color:var(--gold); font-size:12px; font-weight:900; text-transform:uppercase;">Transcrição Técnica Integral</h2>
          <input id="search" type="text" placeholder="Pesquisar cliente ou protocolo..." style="width:100%; padding:15px; border-radius:15px; border:1px solid #fff2; background:#0002; color:#fff; margin-bottom:20px; outline:none;">
          <table>
            <thead><tr><th>Cliente</th><th>Protocolo</th><th>Tribunal</th><th>Alerta</th></tr></thead>
            <tbody id="tableBody"></tbody>
          </table>
        </section>
      </div>
      <div>
        <section class="card">
          <h2 style="color:var(--gold); font-size:12px; font-weight:900; text-transform:uppercase;">Insights Estratégicos</h2>
          <div style="font-size:14px; color:#dbe6f6; line-height:1.6;">
            <p><b>Sumário Operacional:</b> O gabinete monitora ${dataForOmni.stats.total_cases} registros distribuídos em ${dataForOmni.stats.tribunais_unicos} tribunais.</p>
            <p style="margin-top:15px;"><b>Matriz de Risco:</b> ${dataForOmni.insights.indicators}</p>
          </div>
        </section>
        <section class="card" style="margin-top:25px; height:400px;">
           <h2 style="color:var(--gold); font-size:12px; font-weight:900; text-transform:uppercase;">Volumetria por Tribunal</h2>
           <canvas id="tribChart"></canvas>
        </section>
      </div>
    </div>
  </div>

  <div class="detail-panel" id="detailPanel">
    <div onclick="closeDetail()" style="cursor:pointer; font-size:30px; color:#fff; position:absolute; top:20px; right:20px;">&times;</div>
    <div id="detailContent"></div>
  </div>

  <script>
    const data = ${JSON.stringify(dataForOmni)};
    const tbody = document.getElementById('tableBody');
    
    function escapeHtml(text) {
      if(!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    const kpiGrid = document.getElementById('kpi-grid');
    kpiGrid.innerHTML = [
      { v: data.stats.total_cases, l: "REGISTROS" },
      { v: data.stats.tribunais_unicos, l: "TRIBUNAIS" },
      { v: "ATIVO", l: "GABINETE" },
      { v: "${profile?.nome || 'W1'}", l: "AUDITOR" }
    ].map(k => \`<div class="kpi"><div class="kpi-v">\${k.v}</div><div style="font-size:10px; font-weight:900;">\${k.l}</div></div>\`).join('');

    function render(items) {
      tbody.innerHTML = items.slice(0, 100).map(r => \`
        <tr onclick="showDetail('\${r.protocolo}')" style="cursor:pointer;">
          <td style="font-weight:700;">\${escapeHtml(r.cliente)}</td>
          <td style="font-family:monospace; color:var(--muted)">\${r.protocolo}</td>
          <td>\${escapeHtml(r.tribunal)}</td>
          <td><span class="badge \${r.alerta_visual}">\${r.statusContato || 'NORMAL'}</span></td>
        </tr>
      \`).join('');
    }

    function showDetail(prot) {
      const item = data.operational.find(i => i.protocolo === prot);
      document.getElementById('detailContent').innerHTML = \`
        <h3 style="font-size:28px; margin-bottom:10px; color:var(--gold); text-transform:uppercase;">\${escapeHtml(item.cliente)}</h3>
        <p style="color:#fff; font-weight:900; margin-bottom:30px; text-transform:uppercase; letter-spacing:1px; font-size:10px;">Dossiê do Cliente</p>
        \${Object.entries(item).map(([k,v]) => \`
          <div style="margin-bottom:15px; padding:12px; background:rgba(255,255,255,.05); border-radius:10px;">
            <div style="font-size:10px; color:var(--muted); text-transform:uppercase; font-weight:bold;">\${k.replace(/_/g, ' ')}</div>
            <div style="font-weight:700; color:#fff; font-size:14px;">\${v || '---'}</div>
          </div>
        \`).join('')}
      \`;
      document.getElementById('detailPanel').classList.add('open');
    }

    function closeDetail() { document.getElementById('detailPanel').classList.remove('open'); }

    document.getElementById('search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      render(data.operational.filter(i => i.cliente.toLowerCase().includes(q) || i.protocolo.toLowerCase().includes(q)));
    });

    render(data.operational);
    
    const tribs = {};
    data.operational.forEach(i => { tribs[i.tribunal] = (tribs[i.tribunal] || 0) + 1; });
    const sortedTribs = Object.entries(tribs).sort((a,b) => b[1]-a[1]).slice(0,10);

    new Chart(document.getElementById('tribChart'), {
      type: 'bar',
      data: {
        labels: sortedTribs.map(t => t[0].split(' - ')[0]),
        datasets: [{ data: sortedTribs.map(t => t[1]), backgroundColor: '#f5c35b', borderRadius: 8 }]
      },
      options: { 
        indexAxis: 'y', 
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }, 
        scales: { 
          x: { grid: { display: false }, ticks: { color: '#9fb2cb' } }, 
          y: { ticks: { color: '#fff', font: { weight: 'bold' } } } 
        } 
      }
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    saveAs(blob, `OmniReport_Premium_${new Date().toISOString().split('T')[0]}.html`);
    toast({ title: "OmniReport Gerado", description: "O arquivo interativo foi baixado." });
  };

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] space-y-6">
        <div className="w-16 h-16 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="font-light tracking-[0.4em] text-[11px] text-primary uppercase">Sincronizando Dossiê Estratégico</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-primary/30">
      <div className="print:hidden sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" asChild className="text-white/70 hover:text-white hover:bg-white/5 font-medium tracking-wide text-xs uppercase rounded-none h-10 px-4">
              <Link href="/"><ArrowLeft size={14} className="mr-2" /> Voltar ao Gabinete</Link>
            </Button>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex bg-white/5 p-1 rounded-sm gap-1">
               <button 
                 onClick={() => setReportStyle('classic')}
                 className={cn(
                   "px-4 py-1.5 text-[9px] font-black uppercase transition-all flex items-center gap-2",
                   reportStyle === 'classic' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                 )}
               >
                 <Layout size={12} /> Classic PDF
               </button>
               <button 
                 onClick={() => setReportStyle('omni')}
                 className={cn(
                   "px-4 py-1.5 text-[9px] font-black uppercase transition-all flex items-center gap-2",
                   reportStyle === 'omni' ? "bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.4)]" : "text-white/40 hover:text-white"
                 )}
               >
                 <Layers size={12} /> Omni Premium
               </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {reportStyle === 'classic' ? (
              <Button onClick={handleExportPDF} className="bg-white hover:bg-white/90 text-black font-bold uppercase text-[10px] tracking-widest h-11 px-7 rounded-none transition-all">
                <Printer size={14} className="mr-2" /> Imprimir Dossiê Padrão
              </Button>
            ) : (
              <Button onClick={handleExportOmniHTML} className="bg-[#f5c35b] hover:bg-[#d4af37] text-black font-bold uppercase text-[10px] tracking-widest h-11 px-7 rounded-none transition-all shadow-[0_0_20px_rgba(245,195,91,0.3)]">
                <FileCode size={14} className="mr-2" /> Exportar Omni HTML
              </Button>
            )}
          </div>
        </div>
      </div>

      {reportStyle === 'classic' ? (
        <div className="max-w-6xl mx-auto px-6 py-10 print:px-0 print:py-0 animate-in fade-in duration-700">
          <div className="bg-[#111111] border border-white/10 print:border-0 print:bg-[#0a0a0a] shadow-2xl">
            <header className="relative overflow-hidden border-b border-white/5">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="px-10 pt-12 pb-10 flex flex-col lg:flex-row justify-between gap-8">
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-primary flex items-center justify-center"><Scale size={16} className="text-primary" /></div>
                    <span className="text-[10px] tracking-[0.35em] uppercase text-primary font-medium">W1 Capital • Advanced Ops</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] text-white">DOSSIÊ OPERACIONAL<br /><span className="text-primary">DA CARTEIRA</span></h1>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="px-3 py-1.5 bg-primary text-black text-[10px] font-bold tracking-widest uppercase">GABINETE EXECUTIVO</div>
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
                <div className="w-1 h-5 bg-primary" />
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
                  <div className="w-1 h-5 bg-primary" />
                  <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-white/60">Parecer Estratégico da IA</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 p-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Sparkles size={12}/> Pontos Fortes de Gabinete</p>
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
                          <p className="text-[9px] text-primary tracking-widest uppercase mt-0.5">{c.tribunal || "Outros"}</p>
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

            <footer className="px-10 py-10 border-t border-white/5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-primary/50 flex items-center justify-center"><Zap size={16} className="text-primary" /></div>
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">2026 W1 Capital</p>
                    <p className="text-xs text-white/60 font-medium">Relatório Executivo Operacional</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10">
                  <ShieldCheck size={13} className="text-primary" />
                  <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">Auditado por Davi Alves Figueredo</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        /* PREVISUALIZAÇÃO OMNI PREMIUM INTERATIVA */
        <div className="min-h-screen bg-[#07111f] p-8 animate-in fade-in duration-1000">
           <div className="max-w-[1400px] mx-auto space-y-8">
              {/* HERO SECTION PREVIEW */}
              <section className="bg-white/5 border border-white/10 rounded-[30px] p-10 backdrop-blur-xl relative overflow-hidden">
                <div className="relative z-10">
                   <h2 className="text-5xl font-black tracking-tighter text-[#f5c35b] uppercase">Relatório Premium</h2>
                   <p className="text-white/40 text-sm mt-2 uppercase font-medium tracking-[0.2em]">Dossiê Operacional e Processual • Preview Interativo</p>
                   
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                      <OmniKpi v={metrics.totalRepo} l="Registros" />
                      <OmniKpi v={new Set(cases.map(c => c.tribunal)).size} l="Tribunais" />
                      <OmniKpi v="Ativo" l="Gabinete" />
                      <OmniKpi v={profile?.nome || 'W1'} l="Auditor" />
                   </div>
                </div>
              </section>

              {/* MAIN CONTENT PREVIEW */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* LEFT COLUMN */}
                <div className="xl:col-span-8 space-y-8">
                   <div className="bg-[#0a162a]/74 border border-white/10 rounded-[30px] p-8 backdrop-blur-md">
                      <h3 className="text-[#f5c35b] text-[10px] font-black uppercase tracking-[0.3em] mb-6">Parecer do Gabinete</h3>
                      <div className="bg-[#fdfaf3] text-[#2c2c2c] p-8 border-l-[8px] border-[#f5c35b] rounded-2xl">
                         <p className="text-xl font-bold uppercase leading-relaxed">
                           {iaInsights?.summary || "Acompanhamento processual estabilizado conforme as diretrizes da W1 Capital."}
                         </p>
                      </div>
                   </div>

                   <div className="bg-[#0a162a]/74 border border-white/10 rounded-[30px] p-8 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[#f5c35b] text-[10px] font-black uppercase tracking-[0.3em]">Transcrição Técnica Integral</h3>
                        <div className="relative w-72">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                           <Input 
                             placeholder="Filtrar base de dados..." 
                             value={omniSearch}
                             onChange={(e) => setOmniSearch(e.target.value)}
                             className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 text-xs text-white"
                           />
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/5">
                              <th className="py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Cliente</th>
                              <th className="py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Protocolo</th>
                              <th className="py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Tribunal</th>
                              <th className="py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOmniCases.map((c, i) => (
                              <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group cursor-default">
                                <td className="py-4 font-bold text-white group-hover:text-[#f5c35b] transition-colors uppercase">{c.cliente}</td>
                                <td className="py-4 font-mono text-xs text-white/40">{c.protocolo}</td>
                                <td className="py-4 text-xs text-white/60 uppercase">{c.tribunal}</td>
                                <td className="py-4">
                                   <span className={cn(
                                     "px-3 py-1 rounded-full text-[9px] font-black uppercase border",
                                     c.status === 'Vencido' || c.status === 'É Hoje' ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                   )}>
                                     {c.status}
                                   </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="xl:col-span-4 space-y-8">
                   <div className="bg-[#0a162a]/74 border border-white/10 rounded-[30px] p-8 backdrop-blur-md">
                      <h3 className="text-[#f5c35b] text-[10px] font-black uppercase tracking-[0.3em] mb-6">Insights Estratégicos</h3>
                      <div className="space-y-6">
                         <div className="p-5 bg-white/5 rounded-2xl">
                            <p className="text-[10px] font-black text-[#f5c35b] uppercase mb-2">Sumário Operacional</p>
                            <p className="text-sm leading-relaxed text-white/70">O gabinete monitora {metrics.totalRepo} registros com foco central em {metrics.topTribunual}.</p>
                         </div>
                         <div className="p-5 bg-white/5 rounded-2xl border-l-4 border-red-500">
                            <p className="text-[10px] font-black text-red-400 uppercase mb-2">Matriz de Risco</p>
                            <p className="text-sm leading-relaxed text-white/70">Identificados {metrics.countVencido} casos críticos que requerem intervenção imediata.</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[#0a162a]/74 border border-white/10 rounded-[30px] p-8 backdrop-blur-md h-[400px] flex flex-col">
                      <h3 className="text-[#f5c35b] text-[10px] font-black uppercase tracking-[0.3em] mb-8">Volumetria por Tribunal</h3>
                      <div className="flex-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.chartData} layout="vertical" margin={{ left: -20 }}>
                               <XAxis type="number" hide />
                               <YAxis 
                                 dataKey="name" 
                                 type="category" 
                                 axisLine={false} 
                                 tickLine={false} 
                                 tick={{ fill: '#fff', fontSize: 10, fontWeight: 'bold' }} 
                               />
                               <RechartsTooltip 
                                 cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                 contentStyle={{ backgroundColor: '#07111f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                               />
                               <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                  {metrics.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#f5c35b" />
                                  ))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}

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
          .text-primary { color: #00D1FF !important; }
          .border-primary { border-color: #00D1FF !important; }
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

function OmniKpi({ v, l }: { v: string | number, l: string }) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center backdrop-blur-sm group hover:border-[#f5c35b]/30 transition-all">
       <div className="text-3xl font-black text-[#f5c35b] group-hover:scale-110 transition-transform">{v}</div>
       <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">{l}</div>
    </div>
  );
}
