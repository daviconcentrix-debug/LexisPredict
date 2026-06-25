
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Copyright,
  Zap,
  Users,
  Copy,
  MessageSquare,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { executarVereditoAI } from '@/ai/flows/veredito-ai-flow';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const RESPONSE_TEMPLATES = [
  {
    category: "Apresentação",
    items: [
      { title: "Início Setor Processual", text: "Me chamo {seu_nome} e faço parte do Setor Processual da Get Assessoria. Segue as informações do seu processo." },
      { title: "Auxílio Andamento", text: "Muito prazer, me chamo {seu_nome}, faço parte do Setor Processual da Get Assessoria. Irei te auxiliar quanto ao andamento do seu processo. Tendo alguma dúvida, pode estar me sinalizando." }
    ]
  },
  {
    category: "Alerta de Golpe",
    items: [
      { title: "Desconsiderar Informações", text: "Peço que desconsidere quaisquer informações repassadas por essa pessoa, ela não faz parte do nosso escritório." },
      { title: "Acesso de Terceiros", text: "Como o processo não tramita em segredo de justiça, qualquer pessoa que possua um tocken de advogado, consegue ter acesso as informações anexadas no processo." },
      { title: "Contato Exclusivo", text: "Solicitamos que, por gentileza, concentre o contato exclusivamente com o grupo do Setor Jurídico ou diretamente conosco, do Setor Processual." }
    ]
  },
  {
    category: "Audiência",
    items: [
      { title: "Comunicado de Audiência", text: "Após o recebimento do comunicado em seu e-mail contendo a data e horário da audiência, o link para acesso à audiência virtual será enviado em um prazo de 24 a 72 horas." },
      { title: "Agendamento de Conciliação", text: "Referente ao seu procedimento, verificamos que foi agendada uma audiência, para tentativa de conciliação entre as partes." }
    ]
  }
];

export default function VereditoPage() {
  const [cnj, setCnj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [model, setModel] = useState<'gemini' | 'grok' | 'openrouter'>('gemini');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  
  const [userName, setUserName] = useState('');
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'grok' || savedIA === 'gemini' || savedIA === 'openrouter') {
      setModel(savedIA as any);
    }
    const savedName = localStorage.getItem('lexisPredict_consultant_name');
    if (savedName) setUserName(savedName);
  }, []);

  useEffect(() => {
    if (retryAfter === null) return;
    if (retryAfter <= 0) {
      setRetryAfter(null);
      return;
    }
    const timer = setInterval(() => {
      setRetryAfter(prev => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnj) return;
    if (retryAfter !== null) {
      toast({ title: "Motor em Resfriamento", description: `Aguarde ${retryAfter}s para nova consulta.`, variant: "destructive" });
      return;
    }
    
    setLoading(true);
    setResult(null);
    try {
      const data = await executarVereditoAI({ cnj, preferredModel: model });
      setResult(data);
      toast({ title: "Análise Concluída", description: `Engine ${data.engineUtilizada} respondeu.` });
    } catch (error: any) {
      if (error.message.includes('RATE_LIMIT')) {
        const seconds = parseInt(error.message.split(':')[1]) || 20;
        setRetryAfter(seconds);
        toast({ title: "Limite do Motor Atingido", description: `Iniciando resfriamento: ${seconds}s restantes.`, variant: "destructive" });
      } else {
        toast({ title: "Falha na Análise", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Conteúdo pronto para colar no WhatsApp." });
  };

  const handleUseTemplate = (text: string) => {
    let processed = text.replace(/{seu_nome}/g, userName || "(Seu Nome)");
    processed = processed.replace(/{nome_cliente}/g, clientName || "(Nome do Cliente)");
    setSelectedTemplate(processed);
    toast({ title: "Modelo Carregado", description: "Texto pronto no editor." });
  };

  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return RESPONSE_TEMPLATES;
    return RESPONSE_TEMPLATES.map(cat => ({
      ...cat,
      items: cat.items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(cat => cat.items.length > 0);
  }, [searchTerm]);

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Veredito AI (Busca 360)</h1>
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-bold">DataJud Connect Active</Badge>
            <Badge variant="secondary" className="bg-sidebar text-accent border-accent/20 text-[9px] uppercase flex items-center gap-1">
              <Zap size={10} /> {model.toUpperCase()} Active
            </Badge>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={() => window.print()} className="h-8 font-bold border border-border text-muted-foreground hover:text-white">
              <Printer size={14} className="mr-2" /> Export Case Analysis
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="bg-secondary/50 border border-border mb-8">
              <TabsTrigger value="analysis" className="data-[state=active]:bg-primary">Análise 360º</TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-primary">Biblioteca de Respostas</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-8 animate-in fade-in duration-500">
              <section className="text-center space-y-4 max-w-2xl mx-auto mb-12">
                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                  <Cpu className="text-primary w-8 h-8" />
                </div>
                <h2 className="text-3xl font-headline font-bold text-white tracking-tight">OmniReport Intelligent Analyzer</h2>
                <p className="text-muted-foreground text-sm font-medium">Motor v3.0: Integramos DataJud & Inteligência Multi-Provedor.</p>
                
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
                  <Button type="submit" disabled={loading || retryAfter !== null} className="h-12 px-8 bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg min-w-[160px]">
                    {loading ? "Processando..." : retryAfter !== null ? `Aguarde ${retryAfter}s` : "Analisar 360º"}
                  </Button>
                </form>

                {retryAfter !== null && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                    <Clock className="text-destructive w-4 h-4" />
                    <span className="text-xs font-bold text-destructive uppercase tracking-widest">Limite de Uso atingido. Disponível em: {retryAfter} segundos</span>
                  </div>
                )}
              </section>

              {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border-border shadow-2xl overflow-hidden">
                      <CardHeader className="border-b border-border bg-secondary/10">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-white font-headline text-lg">Parecer Técnico Veredito AI</CardTitle>
                          <Badge variant="outline" className="border-chart-3/30 text-chart-3 font-bold uppercase text-[9px]">Engine {result.engineUtilizada}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><FileText size={12} className="text-primary" /> Resumo Estruturado</h4>
                          <p className="text-sm text-white/90 leading-relaxed font-medium bg-secondary/20 p-4 rounded-xl border border-border">{result.resumoTecnico}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><AlertTriangle size={12} className="text-accent" /> Análise de Risco</h4>
                            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                              <p className="text-xs text-white/80 leading-relaxed font-medium italic">{result.analiseRisco}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><ArrowRight size={12} className="text-chart-3" /> Sugestão Estratégica</h4>
                            <div className="p-4 bg-chart-3/5 border border-chart-3/20 rounded-xl">
                              <p className="text-xs text-white/80 leading-relaxed font-medium">{result.proximosPassos}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 shadow-2xl overflow-hidden border-l-4 border-l-primary">
                      <CardHeader className="bg-primary/10 border-b border-primary/20">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2"><Users className="text-primary w-5 h-5" /><CardTitle className="text-white font-headline text-lg">Mensagem ao Cliente</CardTitle></div>
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.mensagemCliente)} className="h-7 text-[10px] font-bold border-primary/30 hover:bg-primary/20">Copiar WhatsApp</Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="bg-sidebar/50 p-6 rounded-2xl border border-border shadow-inner">
                          <p className="text-sm text-white/90 leading-relaxed font-medium italic whitespace-pre-wrap">{result.mensagemCliente}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-card border-border shadow-2xl h-fit">
                      <CardHeader className="border-b border-border bg-secondary/10"><CardTitle className="text-white font-headline text-sm">Metadata DataJud</CardTitle></CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <MetaItem label="Órgão Julgador" value={result.dataJudRaw?.orgaoJulgador?.nome || 'N/A'} />
                        <MetaItem label="Classe" value={result.dataJudRaw?.classe?.nome || 'N/A'} />
                        <MetaItem label="Tribunal" value={result.dataJudRaw?.tribunal || 'N/A'} />
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 mt-4">
                          <p className="text-[9px] text-white/70 font-medium">Análise autenticada por <b>W1 Capital Intelligence</b> sob supervisão de Davi Alves Figueredo.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="bg-card border-border lg:col-span-1 h-fit sticky top-4">
                  <CardHeader><CardTitle className="text-white font-headline text-lg flex items-center gap-2"><Users className="text-primary" /> Dados do Consultor</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="c-name">Seu Nome</Label>
                      <Input id="c-name" value={userName} onChange={(e) => { setUserName(e.target.value); localStorage.setItem('lexisPredict_consultant_name', e.target.value); }} className="bg-secondary border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cl-name">Nome do Cliente</Label>
                      <Input id="cl-name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-secondary border-none" />
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-card border-border shadow-2xl">
                    <CardHeader className="bg-secondary/10 border-b border-border"><CardTitle className="text-white font-headline">Biblioteca de Respostas Humanizadas</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {filteredTemplates.map((cat, idx) => (
                          <AccordionItem key={idx} value={`cat-${idx}`} className="border-border px-6">
                            <AccordionTrigger className="text-white font-bold uppercase text-[11px] tracking-widest">{cat.category}</AccordionTrigger>
                            <AccordionContent className="space-y-3 pb-6">
                              {cat.items.map((item, i) => (
                                <div key={i} className="p-4 bg-secondary/30 border border-border rounded-xl flex items-center justify-between group hover:border-primary/50 transition-all">
                                  <div className="flex-1 pr-4"><h5 className="text-xs font-bold text-white mb-1">{item.title}</h5><p className="text-[10px] text-muted-foreground line-clamp-1">{item.text}</p></div>
                                  <Button size="sm" variant="ghost" onClick={() => handleUseTemplate(item.text)} className="text-primary hover:bg-primary/10 text-[10px] uppercase">Usar Modelo</Button>
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>

                  <Card className="bg-sidebar border-primary/20 shadow-2xl border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/5">
                      <CardTitle className="text-white font-headline text-lg">Mensagem Customizada</CardTitle>
                      <Button onClick={() => copyToClipboard(selectedTemplate)} disabled={!selectedTemplate} className="bg-primary hover:bg-primary/90 font-bold"><Copy size={16} className="mr-2" /> Copiar WhatsApp</Button>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Textarea value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} placeholder="Selecione um modelo acima ou digite..." className="min-h-[200px] bg-secondary/50 border-none text-sm text-white" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <footer className="pt-12 border-t border-border/50 text-center space-y-3 opacity-50">
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
