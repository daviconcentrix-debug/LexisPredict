
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Zap,
  MessageSquare,
  Copy,
  Clock,
  FileText,
  FileSearch,
  History,
  AlertTriangle,
  Search,
  MoreHorizontal,
  Copyright,
  Send,
  User,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { executarVereditoAI } from '@/ai/flows/veredito-ai-flow';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VereditoPage() {
  const [cnj, setCnj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [model, setModel] = useState<'gemini' | 'grok' | 'openrouter'>('openrouter');
  const [deepThinking, setDeepThinking] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnj || retryAfter !== null) return;
    setLoading(true);
    setResult(null);
    setChatMessages([]);
    try {
      const data = await executarVereditoAI({ cnj, preferredModel: model, deepThinking });
      setResult(data);
      toast({ title: "Consulta Concluída", description: "Auditória estratégica gerada com sucesso." });
    } catch (error: any) {
      if (error.message.includes('RATE_LIMIT')) {
        const s = parseInt(error.message.split(':')[1]) || 25;
        setRetryAfter(s);
        toast({ title: "Limite Excedido", description: `Aguarde ${s}s para nova auditoria.`, variant: "destructive" });
      } else {
        toast({ title: "Erro na Auditoria", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !result) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const context = `DADOS REAIS DO TRIBUNAL (DataJud): ${JSON.stringify(result.dataJudRaw)}. 
      RESUMO TÉCNICO: ${result.resumoTecnico}. 
      PERGUNTA DO USUÁRIO: ${chatInput}`;

      const response = await perguntarIA({ 
        pergunta: context, 
        historico: chatMessages.slice(-6),
        preferredModel: model,
        deepThinking
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response.resposta }]);
    } catch (error: any) {
      toast({ title: "Falha na Resposta", description: error.message, variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Minuta Copiada!" });
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-black">
        <header className="h-auto bg-white border-b border-[#dddbda] px-6 py-4 shrink-0 z-40">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="icon-3d-wrapper">
                <div className="icon-3d-block black w-14 h-14 rounded-md">
                  <FileSearch size={32} className="text-white" />
                </div>
              </div>
              <div className="group hover:bg-black p-2 transition-all rounded-sm cursor-default">
                <p className="text-[11px] font-black text-black group-hover:text-white uppercase tracking-widest transition-colors">Auditoria 3D Pro</p>
                <h1 className="text-xl font-black text-black group-hover:text-white tracking-tight uppercase transition-colors">
                  {result ? `Processo ${result.dataJudRaw?.numeroProcesso}` : "Inicie uma Nova Consulta"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-black h-9 font-black text-xs hover:bg-black hover:text-white text-black uppercase transition-all bg-white">Histórico Global</Button>
              <Button variant="outline" size="icon" className="h-9 w-9 border-black text-black hover:bg-black hover:text-white transition-all bg-white"><MoreHorizontal size={16} /></Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-3 border-t border-[#dddbda]/50">
             <HighlightItem label="Tribunal" value={result?.dataJudRaw?.tribunal || '---'} />
             <HighlightItem label="Instância" value={result?.dataJudRaw?.grau || '---'} />
             <HighlightItem label="Sincronizado" value={result ? new Date(result.dataJudRaw?.dataHoraUltimaAtualizacao).toLocaleDateString('pt-BR') : '---'} />
             <HighlightItem label="Status" value={result ? "Auditoria Concluída" : "Aguardando"} isBadge />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {!result && (
              <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
                <div className="space-y-2 group hover:bg-black p-4 transition-all rounded-sm border border-transparent hover:border-black cursor-default">
                  <h2 className="text-3xl font-black text-black group-hover:text-white tracking-tighter uppercase transition-colors">Unidade de Triagem de Gabinete</h2>
                  <p className="text-black/70 group-hover:text-white/70 text-sm font-black uppercase transition-colors">Consulte o número CNJ para extração de inteligência estratégica.</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-3 bg-white p-2 rounded-sm border border-black shadow-xl">
                  <Input 
                    placeholder="0000000-00.2025.8.26.0000" 
                    value={cnj} 
                    onChange={(e) => setCnj(e.target.value)} 
                    className="border-none h-14 text-lg focus-visible:ring-0 font-mono text-black placeholder:text-black/20 bg-white" 
                  />
                  <div className="icon-3d-wrapper">
                    <Button type="submit" disabled={loading || retryAfter !== null} className="h-14 px-8 rounded-sm bg-white text-black border border-black hover:bg-black hover:text-white font-black transition-all shadow-lg uppercase text-xs">
                      {loading ? (
                        <span className="flex items-center gap-2"><Clock className="animate-spin" size={18} /> Consolidando...</span>
                      ) : "Realizar Auditoria"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {result && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
                <div className="lg:col-span-2 space-y-6">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="bg-[#e2e2e2] p-1 h-11 w-full justify-start rounded-t-sm mb-0 border border-black border-b-0">
                      <TabsTrigger value="details" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-xs px-6 h-9 uppercase transition-all text-black">Parecer Técnico</TabsTrigger>
                      <TabsTrigger value="activity" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-xs px-6 h-9 uppercase transition-all text-black">Linha do Tempo</TabsTrigger>
                      <TabsTrigger value="chatter" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-xs px-6 h-9 uppercase transition-all text-black">Consultoria de Gabinete</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-0">
                      <Card className="bg-white border-black shadow-sm rounded-b-sm rounded-t-none border-t-0 overflow-hidden">
                        <CardHeader className="bg-[#f8f9fb] border-b border-black py-3">
                          <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} /> Diagnóstico Técnico Sênior
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                          <div className="space-y-2 group hover:bg-black p-4 transition-all rounded-sm border border-black hover:border-black cursor-default">
                            <Label className="text-[10px] font-black text-black group-hover:text-white uppercase tracking-widest transition-colors">Andamento Atual Sincronizado</Label>
                            <div className="bg-[#f3f2f2] p-4 border border-black/10 rounded-sm group-hover:bg-gray-900 group-hover:border-white/20 transition-all">
                              <p className="text-sm leading-relaxed text-black group-hover:text-white font-black whitespace-pre-wrap italic uppercase transition-colors">{result.resumoTecnico}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 hover:bg-black p-4 transition-all rounded-sm group cursor-default border border-transparent hover:border-black">
                              <Label className="text-[10px] font-black text-black group-hover:text-white uppercase tracking-widest transition-colors">Análise Preditiva de Risco</Label>
                              <p className="text-xs text-black group-hover:text-white leading-relaxed border-l-4 border-black group-hover:border-white pl-4 whitespace-pre-wrap font-black uppercase transition-colors">{result.analiseRisco}</p>
                            </div>
                            <div className="space-y-2 hover:bg-black p-4 transition-all rounded-sm group cursor-default border border-transparent hover:border-black">
                              <Label className="text-[10px] font-black text-black group-hover:text-white uppercase tracking-widest transition-colors">Estratégia de Gabinete</Label>
                              <p className="text-xs text-black group-hover:text-white leading-relaxed border-l-4 border-black group-hover:border-white pl-4 whitespace-pre-wrap font-black uppercase transition-colors">{result.proximosPassos}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="mt-0">
                      <Card className="bg-white border-black shadow-sm rounded-b-sm rounded-t-none border-t-0 overflow-hidden">
                        <CardHeader className="bg-[#f8f9fb] border-b border-black py-3">
                          <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <History size={14} /> Histórico Oficial DataJud
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-black/10">
                            {result.historicoMovimentacoes && result.historicoMovimentacoes.length > 0 ? result.historicoMovimentacoes.map((mov: any, idx: number) => (
                              <div key={idx} className="p-4 hover:bg-black group transition-all flex gap-6 items-start cursor-default">
                                <div className="text-[10px] font-black text-black bg-[#e2e2e2] px-2 py-1 rounded-sm w-28 text-center shrink-0 border border-black group-hover:bg-white group-hover:text-black transition-all uppercase">{mov.data}</div>
                                <div className="text-xs text-black group-hover:text-white font-black leading-tight uppercase transition-all">{mov.movimento}</div>
                              </div>
                            )) : (
                              <div className="p-12 text-center text-xs text-black font-black uppercase italic">Nenhuma movimentação processual capturada.</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="chatter" className="mt-0">
                      <Card className="bg-white border-black shadow-lg rounded-b-sm rounded-t-none border-t-0 flex flex-col h-[500px] overflow-hidden">
                        <CardHeader className="bg-[#f8f9fb] border-b border-black py-3 flex flex-row items-center justify-between shrink-0">
                          <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={14} /> Consultoria de Gabinete Ativa
                          </CardTitle>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(result.mensagemCliente)} 
                            className="h-7 text-[8px] font-black uppercase text-black hover:bg-black hover:text-white border border-black transition-all bg-white"
                          >
                            <Copy size={12} className="mr-2" /> Copiar Minuta WhatsApp
                          </Button>
                        </CardHeader>
                        
                        <ScrollArea className="flex-1 p-4 bg-[#f3f2f2]" ref={scrollRef}>
                          <div className="space-y-4">
                            <div className="flex justify-start">
                              <div className="bg-white border border-black p-4 rounded-sm max-w-[80%] shadow-sm hover:bg-black hover:text-white group transition-all cursor-default text-black">
                                <p className="text-[9px] font-black text-black group-hover:text-white/70 uppercase mb-1 flex items-center gap-1">
                                  <Bot size={10} /> Sugestão de Contato
                                </p>
                                <p className="text-[10px] italic group-hover:text-white leading-relaxed font-black uppercase transition-colors">{result.mensagemCliente}</p>
                              </div>
                            </div>

                            {chatMessages.map((msg, i) => (
                              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                  "p-3 rounded-sm max-w-[85%] shadow-sm text-[10px] font-black uppercase transition-all border",
                                  msg.role === 'user' ? "bg-black text-white border-white/20" : "bg-white border-black text-black hover:bg-black hover:text-white"
                                )}>
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-black bg-white shrink-0">
                          <form onSubmit={handleChat} className="flex gap-2">
                            <Input 
                              placeholder="FAÇA UMA PERGUNTA TÉCNICA..." 
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              disabled={chatLoading}
                              className="flex-1 bg-[#f3f2f2] border-black text-[10px] font-black text-black uppercase focus-visible:ring-0"
                            />
                            <Button type="submit" size="icon" disabled={chatLoading} className="bg-white text-black border border-black hover:bg-black hover:text-white transition-all shadow-md">
                              <Send size={16} />
                            </Button>
                          </form>
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="space-y-6">
                  <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] py-3 px-6 border-b border-black">
                      <CardTitle className="text-[9px] font-black text-black uppercase tracking-[0.2em]">Metadados de Gabinete</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <RelatedItem label="Natureza" value={result.dataJudRaw?.classe?.nome || 'Não informada'} />
                      <RelatedItem label="Orgão Julgador" value={result.dataJudRaw?.orgaoJulgador?.nome || 'Gabinete Local'} />
                      <RelatedItem label="Assunto" value={result.dataJudRaw?.assuntos?.[0]?.nome || 'Contratual'} />
                      <RelatedItem label="Ajuizamento" value={result.dataJudRaw?.dataAjuizamento ? `${result.dataJudRaw.dataAjuizamento.substring(6,8)}/${result.dataJudRaw.dataAjuizamento.substring(4,6)}/${result.dataJudRaw.dataAjuizamento.substring(0,4)}` : '---'} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black font-black uppercase tracking-[0.2em] shrink-0 hover:bg-black hover:text-white transition-all cursor-default">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
          </div>
          <span className="w-1 h-1 bg-black rounded-full opacity-30 group-hover:bg-white" />
          <span className="uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function HighlightItem({ label, value, isBadge = false }: { label: string, value: string, isBadge?: boolean }) {
  return (
    <div className="space-y-1 group hover:bg-black p-1 transition-all rounded-sm cursor-default">
      <p className="text-[9px] font-black text-black group-hover:text-white uppercase transition-colors">{label}</p>
      {isBadge ? (
        <Badge variant="outline" className="bg-[#e2e2e2] text-black border-black font-black text-[8px] px-2 py-0 group-hover:bg-white group-hover:text-black transition-all">
          {value}
        </Badge>
      ) : (
        <p className="text-[10px] font-black text-black group-hover:text-white truncate max-w-[150px] uppercase transition-colors">{value}</p>
      )}
    </div>
  );
}

function RelatedItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1 border-b border-[#f3f2f2] pb-4 last:border-0 last:pb-0 hover:bg-black p-2 transition-all group rounded-sm cursor-default">
      <p className="text-[8px] font-black text-black/40 group-hover:text-white/40 uppercase tracking-widest transition-colors">{label}</p>
      <p className="text-[10px] font-black text-black group-hover:text-white leading-tight uppercase transition-all">{value}</p>
    </div>
  );
}
