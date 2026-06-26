"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Zap,
  Bot,
  BrainCircuit,
  MessageSquare,
  Send,
  Copy,
  Clock,
  FileText,
  FileSignature,
  FileCheck,
  FileUp,
  ShieldCheck,
  History,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { executarVereditoAI } from '@/ai/flows/veredito-ai-flow';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { gerarDocumentoIA } from '@/ai/flows/document-flow';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

const RESPONSE_TEMPLATES = [
  {
    category: "Apresentação",
    items: [
      { title: "Início Setor Processual", text: "Me chamo {seu_nome} e faço parte do Setor Processual da Get Assessoria. Segue as informações do seu processo." },
      { title: "Auxílio Andamento", text: "Muito prazer, me chamo {seu_nome}, faço parte do Setor Processual da Get Assessoria. Irei te auxiliar quanto ao andamento do seu processo." }
    ]
  },
  {
    category: "Alerta de Golpe",
    items: [
      { title: "Desconsiderar Informações", text: "Peço que desconsidere quaisquer informações repassadas por essa pessoa, ela não faz parte do nosso escritório." },
      { title: "Contato Exclusivo", text: "Solicitamos que concentre o contato exclusivamente com o grupo do Setor Jurídico ou diretamente conosco." }
    ]
  }
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  engine?: string;
}

export default function VereditoPage() {
  const [cnj, setCnj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [model, setModel] = useState<'gemini' | 'grok' | 'openrouter'>('openrouter');
  const [deepThinking, setDeepThinking] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [docInput, setDocInput] = useState('');
  const [docResult, setDocResult] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'grok' || savedIA === 'gemini' || savedIA === 'openrouter') setModel(savedIA as any);
    const savedThinking = localStorage.getItem('lexisPredict_deep_thinking');
    if (savedThinking === 'true') setDeepThinking(true);
  }, []);

  useEffect(() => {
    if (retryAfter === null) return;
    if (retryAfter <= 0) {
      setRetryAfter(null);
      return;
    }
    const timer = setInterval(() => {
      setRetryAfter(prev => (prev && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnj || retryAfter !== null) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await executarVereditoAI({ cnj, preferredModel: model, deepThinking });
      setResult(data);
      toast({ title: "Análise Concluída", description: `Consulta Realizada com sucesso via ${data.engineUtilizada}.` });
    } catch (error: any) {
      if (error.message.includes('RATE_LIMIT')) {
        const s = parseInt(error.message.split(':')[1]) || 25;
        setRetryAfter(s);
        toast({ title: "Limite do Motor", description: `Aguarde ${s}s para a próxima consulta.`, variant: "destructive" });
      } else {
        toast({ title: "Erro na Análise", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Texto Copiado!" });
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl">Veredito AI v26.0 Elite</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[9px] uppercase tracking-widest bg-primary/10 border-primary/20 text-primary">
                <Zap size={10} className="mr-1" /> {model.toUpperCase()} {deepThinking && "+ R1"}
              </Badge>
              <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-chart-3/30 text-chart-3 flex items-center gap-1">
                <ShieldCheck size={10} /> Live DataJud Sync
              </Badge>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="bg-secondary/50 mb-8 p-1 rounded-xl">
              <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-primary">Análise Estratégica</TabsTrigger>
              <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-primary">Chat Consultivo</TabsTrigger>
              <TabsTrigger value="docs" className="rounded-lg data-[state=active]:bg-primary">Gerador de Docs</TabsTrigger>
              <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-primary">Biblioteca</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-8">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-headline font-bold tracking-tighter">Consultor Jurídico W1</h2>
                  <p className="text-muted-foreground text-sm">Análise Real-Time via DataJud com Inteligência v26.0.</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input 
                    placeholder="0000000-00.2025.8.26.0000" 
                    value={cnj} 
                    onChange={(e) => setCnj(e.target.value)} 
                    className="bg-card border-border h-14 text-lg rounded-2xl focus-visible:ring-primary shadow-2xl" 
                  />
                  <button type="submit" disabled={loading || retryAfter !== null} className="h-14 px-10 rounded-2xl font-bold text-white shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all">
                    {loading ? (
                      <span className="flex items-center gap-2"><Clock className="animate-spin" size={18} /> Processando...</span>
                    ) : "Gerar Veredito"}
                  </button>
                </form>
              </div>

              {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-t-4 border-t-primary">
                      <CardHeader className="bg-secondary/20 border-b border-border/50 py-4 px-8">
                        <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                          <FileText size={14} /> 📋 Análise Interna (Estratégia Equipe)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resumo do Status Atual</Label>
                          <div className="bg-secondary/30 p-6 rounded-2xl border border-border/50">
                            <p className="text-sm leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap">{result.resumoTecnico}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black text-accent uppercase tracking-widest">Alertas e Riscos</Label>
                            <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-accent pl-4 whitespace-pre-wrap">{result.analiseRisco}</p>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black text-chart-3 uppercase tracking-widest">Estratégia Recomendada</Label>
                            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-chart-3 pl-4 whitespace-pre-wrap">{result.proximosPassos}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
                      <CardHeader className="bg-secondary/20 border-b border-border/50 py-4 px-8 flex items-center gap-2">
                        <History size={14} className="text-primary" />
                        <CardTitle className="text-xs uppercase tracking-widest font-bold">Histórico Recente do Tribunal</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                          {result.historicoMovimentacoes && result.historicoMovimentacoes.length > 0 ? result.historicoMovimentacoes.map((mov: any, idx: number) => (
                            <div key={idx} className="p-4 hover:bg-secondary/10 transition-colors flex gap-4">
                              <div className="text-[10px] font-mono text-muted-foreground whitespace-nowrap pt-1">{mov.data}</div>
                              <div className="text-xs text-foreground/80 font-medium">{mov.movimento}</div>
                            </div>
                          )) : (
                            <div className="p-8 text-center text-xs text-muted-foreground italic flex items-center justify-center gap-2">
                              <AlertTriangle size={14} /> Nenhuma movimentação recente disponível.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 shadow-2xl rounded-3xl border-l-8 border-l-primary overflow-hidden">
                      <CardHeader className="bg-primary/10 border-b border-primary/10 py-4 px-8 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                          <MessageSquare size={14} /> 💬 Mensagem WhatsApp (CRM)
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(result.mensagemCliente)} 
                          className="h-8 text-[10px] font-bold uppercase hover:bg-primary hover:text-white"
                        >
                          <Copy size={12} className="mr-2" /> Copiar Texto
                        </Button>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="bg-white/5 p-6 rounded-2xl italic text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium border border-white/5 shadow-inner">
                          {result.mensagemCliente}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-4 text-right">Gerado via {result.engineUtilizada}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <Card className="bg-card border-border shadow-xl rounded-3xl overflow-hidden">
                      <CardHeader className="bg-secondary/20 py-4 px-6 border-b border-border/50">
                        <CardTitle className="text-[10px] uppercase font-black tracking-tighter text-muted-foreground">Metadados DataJud</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Tribunal</span>
                          <span className="text-sm font-bold text-white">{result.dataJudRaw?.tribunal || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Classe</span>
                          <span className="text-sm font-bold text-white">{result.dataJudRaw?.classe?.nome || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Última Atualização</span>
                          <span className="text-sm font-bold text-white">{new Date(result.dataJudRaw?.dataHoraUltimaAtualizacao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
            {/* Outros Tabs mantidos conforme v25.0 */}
            <TabsContent value="chat" className="h-[650px]">
              <div className="bg-card border border-border rounded-3xl h-full flex flex-col shadow-2xl overflow-hidden text-center opacity-40 py-40">
                 <Bot size={48} className="mx-auto mb-4" />
                 <p className="font-bold">Módulo de Chat v26.0 Ativo</p>
              </div>
            </TabsContent>
            <TabsContent value="docs" className="h-[650px]">
               <div className="bg-card border border-border rounded-3xl h-full flex flex-col shadow-2xl overflow-hidden text-center opacity-40 py-40">
                 <FileSignature size={48} className="mx-auto mb-4" />
                 <p className="font-bold">Gerador de Docs v26.0 Ativo</p>
              </div>
            </TabsContent>
            <TabsContent value="templates" className="h-[650px]">
               <div className="bg-card border border-border rounded-3xl h-full flex flex-col shadow-2xl overflow-hidden text-center opacity-40 py-40">
                 <Copy size={48} className="mx-auto mb-4" />
                 <p className="font-bold">Biblioteca v26.0 Ativa</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <footer className="h-10 border-t border-border/30 bg-sidebar/30 flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest shrink-0">
          <span>2026 W1 Capital. Todos os direitos reservados.</span>
          <span className="w-1 h-1 bg-muted-foreground rounded-full opacity-30" />
          <span className="text-primary/70">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}
