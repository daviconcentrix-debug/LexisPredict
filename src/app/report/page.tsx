
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
  Sparkles,
  TrendingDown,
  Layout,
  Layers,
  FileCode,
  Search
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
    
    const riskSum = (countVencido * 1.0) + (countHoje * 0.8) + (countAtencao * 0.5) + (countSaudavel * 0.1);
    const riskScore = activeTotal > 0 ? Math.min(100, Math.round((riskSum / activeTotal) * 100)) : 0;

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
      riskScore, 
      chartData,
      topTribunal: Object.entries(tribCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'TJSP'
    };
  }, [cases]);

  const filteredOmniCases = useMemo(() => {
    const q = omniSearch.toLowerCase();
    return cases.filter(c => 
      c.cliente.toLowerCase().includes(q) || 
      c.protocolo.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [cases, omniSearch]);

  const handleExportOmniHTML = () => {
    const summaryText = iaInsights?.summary || "Acompanhamento processual estabilizado pelo sistema LexisPredict.";
    
    const dataForOmni = {
      stats: {
        total_cases: metrics.totalRepo,
        tribunais_unicos: new Set(cases.map(c => c.tribunal)).size,
        top_tribunal: metrics.topTribunal,
      },
      operational: cases.map(c => ({
        protocolo: c.protocolo,
        cliente: c.cliente,
        tribunal: c.tribunal,
        risco: c.risco,
        statusContato: c.status,
        alerta_visual: c.status === 'Vencido' || c.status === 'É Hoje' ? 'red' : (c.status === 'Atenção' ? 'gold' : 'green')
      }))
    };

    const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Dossiê Executivo Premium • OmniReport</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Space+Grotesk:wght@700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>
  <style>
    :root{ --bg:#07111f; --bg2:#0c1d35; --panel:rgba(10,22,42,.74); --gold:#f5c35b; --text:#edf4ff; --muted:#9fb2cb; --radius:28px; }
    body{ background:linear-gradient(160deg, var(--bg), var(--bg2)); color:var(--text); font-family:'Inter', sans-serif; padding:30px; margin:0; overflow-x:hidden; }
    #particles-js{ position:fixed; inset:0; z-index:-1; opacity:.4; }
    .shell{ max-width:1400px; margin:0 auto; position:relative; }
    .hero{ background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); border:1px solid rgba(255,255,255,.1); border-radius:30px; padding:40px; backdrop-filter:blur(20px); margin-bottom:30px; }
    .title{ font-family:'Space Grotesk', sans-serif; font-size:48px; font-weight:900; margin:0; letter-spacing:-2px; color:var(--gold); text-transform: uppercase; }
    .grid-kpi{ display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-top:30px; }
    .kpi{ background:rgba(255,255,255,.05); padding:20px; border-radius:20px; border:1px solid rgba(255,255,255,.1); text-align:center; }
    .kpi-v{ font-size:32px; font-weight:900; color:var(--gold); }
    .card{ background:var(--panel); border:1px solid rgba(255,255,255,.1); border-radius:30px; padding:25px; backdrop-filter:blur(15px); }
    .note-box{ background:#fdfaf3; color:#2c2c2c; border-radius:20px; padding:30px; border-left:8px solid var(--gold); margin:20px 0; }
    .note-text{ font-family: 'Dancing Script', cursive; font-size: 32px; text-align:center; }
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
  <div id="particles-js"></div>
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
          <div class="note-box"><div class="note-text">${summaryText}</div></div>
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

    particlesJS('particles-js', {
      particles: { number: { value: 40 }, color: { value: '#f5c35b' }, opacity: { value: 0.2 }, size: { value: 2 }, move: { speed: 1 } }
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
        <p className="font-light tracking-[0.4em] text-[11px] text-primary uppercase">Sincronizando Dossiê</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-primary/30">
      <div className="print:hidden sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" asChild className="text-white/70 hover:text-white hover:bg-white/5 font-medium tracking-wide text-xs uppercase rounded-none h-10 px-4">
              <Link href="/"><ArrowLeft size={14} className="mr-2" /> Gabinete</Link>
            </Button>
            <div className="flex bg-white/5 p-1 rounded-sm gap-1">
               <button onClick={() => setReportStyle('classic')} className={cn("px-4 py-1.5 text-[9px] font-black uppercase transition-all", reportStyle === 'classic' ? "bg-white text-black" : "text-white/40")}>Classic PDF</button>
               <button onClick={() => setReportStyle('omni')} className={cn("px-4 py-1.5 text-[9px] font-black uppercase transition-all", reportStyle === 'omni' ? "bg-primary text-black" : "text-white/40")}>Omni Premium</button>
            </div>
          </div>
          <Button onClick={reportStyle === 'classic' ? () => window.print() : handleExportOmniHTML} className="bg-white hover:bg-white/90 text-black font-bold uppercase text-[10px] tracking-widest h-11 px-7 rounded-none transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            {reportStyle === 'classic' ? <><Printer size={14} className="mr-2" /> Imprimir</> : <><FileCode size={14} className="mr-2" /> Exportar Omni HTML</>}
          </Button>
        </div>
      </div>

      {reportStyle === 'classic' ? (
        <div className="max-w-6xl mx-auto px-6 py-10 print:px-0 print:py-0">
          <div className="bg-[#111111] border border-white/10 p-10 print:border-0 print:bg-white print:text-black">
             <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Dossiê Operacional</h1>
             <p className="opacity-40 uppercase text-xs tracking-widest mb-10">{new Date().toLocaleDateString('pt-BR')}</p>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <Kpi v={metrics.totalRepo} l="Total" />
                <Kpi v={metrics.countVencido} l="Vencidos" />
                <Kpi v={metrics.countHoje} l="Hoje" />
                <Kpi v={metrics.riskScore + '%'} l="Risco" />
             </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[#07111f] p-8 animate-in fade-in duration-1000 relative overflow-hidden">
           <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
              <section className="bg-white/5 border border-white/10 rounded-[30px] p-10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                 <h2 className="text-5xl font-black tracking-tighter text-[#f5c35b] uppercase font-['Space_Grotesk']">Omni Preview</h2>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                    <OmniKpi v={metrics.totalRepo} l="Registros" />
                    <OmniKpi v={new Set(cases.map(c => c.tribunal)).size} l="Tribunais" />
                    <OmniKpi v="Ativo" l="Status" />
                    <OmniKpi v={profile?.nome?.split(' ')[0] || 'W1'} l="Auditor" />
                 </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 space-y-8">
                   <div className="bg-[#0a162a]/74 border border-white/10 rounded-[30px] p-8 backdrop-blur-md shadow-xl">
                      <h3 className="text-[#f5c35b] text-[10px] font-black uppercase tracking-[0.3em] mb-6">Parecer do Gabinete</h3>
                      <div className="bg-[#fdfaf3] text-[#2c2c2c] p-10 border-l-[8px] border-[#f5c35b] rounded-2xl shadow-inner font-['Dancing_Script'] text-3xl text-center">
                         {iaInsights?.summary || "Acompanhamento processual estabilizado pelo sistema."}
                      </div>
                   </div>
                   <div className="bg-[#0a162a]/74 border border-white/10 rounded-[30px] p-8 backdrop-blur-md shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[#f5c35b] text-[10px] font-black uppercase tracking-[0.3em]">Transcrição Integral</h3>
                        <div className="relative w-72">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                           <Input placeholder="Filtrar..." value={omniSearch} onChange={(e) => setOmniSearch(e.target.value)} className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 text-xs text-white" />
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/5">
                              <th className="py-4 text-[10px] font-black text-white/30 uppercase">Cliente</th>
                              <th className="py-4 text-[10px] font-black text-white/30 uppercase">Protocolo</th>
                              <th className="py-4 text-[10px] font-black text-white/30 uppercase">Alerta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOmniCases.map((c, i) => (
                              <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] group cursor-default">
                                <td className="py-4 font-bold text-white group-hover:text-[#f5c35b] uppercase text-sm">{c.cliente}</td>
                                <td className="py-4 font-mono text-xs text-white/40">{c.protocolo}</td>
                                <td className="py-4">
                                   <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase border", c.status === 'Vencido' ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30")}>
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
                <div className="xl:col-span-4 space-y-8">
                   <div className="bg-[#0a162a]/74 border border-white/10 rounded-[30px] p-8 backdrop-blur-md h-[400px] flex flex-col shadow-xl">
                      <h3 className="text-[#f5c35b] text-[10px] font-black uppercase mb-8">Volumetria por Tribunal</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={metrics.chartData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontSize: 10, fontWeight: 'bold' }} />
                            <Bar dataKey="count" fill="#f5c35b" radius={[0, 4, 4, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ v, l }: { v: any, l: string }) {
  return (
    <div className="bg-black/20 p-6 border border-white/5">
       <div className="text-2xl font-black">{v}</div>
       <div className="text-[9px] uppercase font-bold opacity-40">{l}</div>
    </div>
  );
}

function OmniKpi({ v, l }: { v: any, l: string }) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center backdrop-blur-sm group hover:border-[#f5c35b]/30 transition-all shadow-lg">
       <div className="text-3xl font-black text-[#f5c35b]">{v}</div>
       <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">{l}</div>
    </div>
  );
}
