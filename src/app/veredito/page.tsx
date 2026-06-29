"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { FileText, FileSearch, History, Search, MoreHorizontal, Copyright, Send, Bot, User, Clock, Copy, MessageSquare } from 'lucide-react';
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
  const isMounted = useRef(true);
  
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    isMounted.current = true;
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'grok' || savedIA === 'gemini' || savedIA === 'openrouter') setModel(savedIA as any);
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnj || loading) return;
    setLoading(true);
    setResult(null);
    setChatMessages([]);
    try {
      const data = await executarVereditoAI({ cnj, preferredModel: model });
      if (isMounted.current) {
        setResult(data);
        toast({ title: "Auditoria Gerada" });
      }
    } catch (error: any) {
      if (isMounted.current) toast({ title: "Erro na Auditoria", description: error.message, variant: "destructive" });
    } finally {
      if (isMounted.current) setLoading(false);
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
      const context = `DataJud: ${JSON.stringify(result.dataJudRaw)}. Resumo: ${result.resumoTecnico}. Pergunta: ${chatInput}`;
      const response = await perguntarIA({ 
        pergunta: context, 
        historico: chatMessages.slice(-6),
        preferredModel: model
      });

      if (isMounted.current) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.resposta }]);
      }
    } catch (error: any) {
      if (isMounted.current) toast({ title: "Falha na Resposta", description: error.message, variant: "destructive" });
    } finally {
      if (isMounted.current) setChatLoading(false);
    }
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
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">Auditoria de Gabinete</p>
                <h1 className="text-xl font-black uppercase">
                  {result ? `Processo ${result.dataJudRaw?.numeroProcesso}` : "Nova Consulta"}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {!result && (
              <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Unidade de Triagem Técnica</h2>
                <form onSubmit={handleSearch} className="flex gap-3 bg-white p-2 rounded-none border-2 border-black shadow-xl">
                  <Input 
                    placeholder="0000000-00.2025.8.26.0000" 
                    value={cnj} 
                    onChange={(e) => setCnj(e.target.value)} 
                    className="border-none h-14 text-lg focus-visible:ring-0 font-mono text-black bg-white rounded-none" 
                  />
                  <Button type="submit" disabled={loading} className="h-14 px-8 rounded-none bg-black text-white font-black hover:bg-gray-800 transition-all shadow-lg uppercase text-xs border-2 border-black">
                    {loading ? "Processando..." : "Realizar Auditoria"}
                  </Button>
                </form>
              </div>
            )}

            {result && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
                <div className="lg:col-span-2 space-y-6">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="bg-[#e2e2e2] p-1 h-11 w-full justify-start rounded-none mb-0 border-2 border-black border-b-0">
                      <TabsTrigger value="details" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-xs px-6 h-9 uppercase rounded-none">Parecer Técnico</TabsTrigger>
                      <TabsTrigger value="chatter" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-xs px-6 h-9 uppercase rounded-none">Consultoria</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-0">
                      <Card className="bg-white border-2 border-black shadow-none rounded-none border-t-0 overflow-hidden">
                        <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                          <CardTitle className="text-[10px] font-black text-black uppercase flex items-center gap-2">
                            <FileText size={14} /> Diagnóstico Estratégico
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                          <div className="space-y-2 p-4 bg-[#f3f2f2] border-2 border-black">
                            <Label className="text-[10px] font-black uppercase">Andamento Sincronizado</Label>
                            <p className="text-sm leading-relaxed text-black font-black uppercase italic">{result.resumoTecnico}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase">Análise de Risco</Label>
                              <p className="text-xs text-black leading-relaxed border-l-4 border-black pl-4 font-black uppercase">{result.analiseRisco}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase">Estratégia</Label>
                              <p className="text-xs text-black leading-relaxed border-l-4 border-black pl-4 font-black uppercase">{result.proximosPassos}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="chatter" className="mt-0">
                      <Card className="bg-white border-2 border-black shadow-lg rounded-none border-t-0 flex flex-col h-[500px] overflow-hidden">
                        <ScrollArea className="flex-1 p-4 bg-[#f3f2f2]" ref={scrollRef}>
                          <div className="space-y-4">
                            {chatMessages.map((msg, i) => (
                              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                  "p-3 rounded-none max-w-[85%] shadow-sm text-[10px] font-black uppercase border-2",
                                  msg.role === 'user' ? "bg-black text-white border-black" : "bg-white border-black text-black"
                                )}>
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="p-4 border-t-2 border-black bg-white">
                          <form onSubmit={handleChat} className="flex gap-2">
                            <Input placeholder="DÚVIDA TÉCNICA..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-[#f3f2f2] border-2 border-black text-[10px] font-black uppercase rounded-none" />
                            <Button type="submit" size="icon" className="bg-black text-white border-2 border-black rounded-none">
                              <Send size={16} />
                            </Button>
                          </form>
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital.
          </div>
          <span className="uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}
