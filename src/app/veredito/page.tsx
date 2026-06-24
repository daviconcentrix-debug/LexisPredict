"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  ShieldCheck, 
  Search, 
  Cpu, 
  FileText, 
  AlertTriangle, 
  ArrowRight,
  Database,
  Printer,
  Copyright
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { executarVereditoAI } from '@/ai/flows/veredito-ai-flow';
import { cn } from '@/lib/utils';

export default function VereditoPage() {
  const [cnj, setCnj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnj) return;
    
    setLoading(true);
    setResult(null);
    try {
      const data = await executarVereditoAI({ cnj });
      setResult(data);
      toast({ title: "Análise Concluída", description: "Dados sincronizados via DataJud e Veredito AI." });
    } catch (error: any) {
      toast({ title: "Falha na Extração", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Veredito AI (Busca 360)</h1>
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-bold">DataJud Connect Active</Badge>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-muted-foreground hover:text-white border border-border h-8 font-bold">
              <Printer size={14} className="mr-2" /> Export Case Analysis
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8 max-w-6xl mx-auto w-full">
          <section className="text-center space-y-4 max-w-2xl mx-auto mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
              <Cpu className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-3xl font-headline font-bold text-white tracking-tight">OmniReport Intelligent Analyzer</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Motor de análise técnica v3.0. Integramos o DataJud à lógica cognitiva do Gemini para processar protocolos em segundos.
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-2 mt-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Digite o CNJ (ex: 0000000-00.2024.8.26.0000)" 
                  value={cnj}
                  onChange={(e) => setCnj(e.target.value)}
                  className="pl-12 bg-card border-border h-12 rounded-xl focus-visible:ring-primary text-white font-mono"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 px-8 bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg">
                {loading ? "Processando..." : "Analisar 360º"}
              </Button>
            </form>
          </section>

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="lg:col-span-2 bg-card border-border shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-secondary/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white font-headline text-lg">Parecer Técnico Veredito AI</CardTitle>
                      <CardDescription className="font-mono text-xs mt-1 text-primary">{cnj}</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-chart-3/30 text-chart-3 font-bold uppercase text-[9px]">Sincronizado</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <FileText size={12} className="text-primary" /> Resumo Estruturado
                    </h4>
                    <p className="text-sm text-white/90 leading-relaxed font-medium bg-secondary/20 p-4 rounded-xl border border-border">
                      {result.resumoTecnico}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <AlertTriangle size={12} className="text-accent" /> Análise de Risco
                      </h4>
                      <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                        <p className="text-xs text-white/80 leading-relaxed font-medium italic">
                          {result.analiseRisco}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <ArrowRight size={12} className="text-chart-3" /> Sugestão Estratégica
                      </h4>
                      <div className="p-4 bg-chart-3/5 border border-chart-3/20 rounded-xl">
                        <p className="text-xs text-white/80 leading-relaxed font-medium">
                          {result.proximosPassos}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-2xl flex flex-col">
                <CardHeader className="border-b border-border bg-secondary/10">
                  <div className="flex items-center gap-2">
                    <Database className="text-primary w-4 h-4" />
                    <CardTitle className="text-white font-headline text-sm">Metadata DataJud</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-6">
                   <div className="space-y-4">
                    <MetaItem label="Órgão Julgador" value={result.dataJudRaw?.orgaoJulgador?.nome || 'N/A'} />
                    <MetaItem label="Classe" value={result.dataJudRaw?.classe?.nome || 'N/A'} />
                    <MetaItem label="Tribunal" value={result.dataJudRaw?.tribunal || 'N/A'} />
                    <MetaItem label="Grau" value={result.dataJudRaw?.grau || '1º Grau'} />
                    <MetaItem label="Última Atualização" value={new Date(result.dataJudRaw?.dataHoraUltimaAtualizacao).toLocaleString('pt-BR') || 'N/A'} />
                  </div>
                </CardContent>
                <div className="p-6 border-t border-border bg-secondary/5 mt-auto">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                    <ShieldCheck className="text-primary w-5 h-5 shrink-0" />
                    <p className="text-[10px] text-white/70 font-medium">Análise autenticada por <b>W1 Capital Intelligence</b> sob supervisão de Davi Alves Figueredo.</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <footer className="pt-12 border-t border-border/50 text-center space-y-3 opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Copyright size={10} /> 2024 W1 Capital. Todos os direitos reservados.
            </div>
            <p className="text-[9px] uppercase tracking-tighter font-black text-primary/80">FUNDADOR DAVI ALVES FIGUEREDO • VEREDITO IA v3.0 ENGINE</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function MetaItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-xs text-white font-bold truncate" title={value}>{value}</p>
    </div>
  );
}
