"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { FileSearch, History, FileText, Search, Copyright, Send, Bot, Clock, Copy, MessageCircle, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { executarVereditoAI } from '@/ai/flows/veredito-ai-flow';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { sendYCloudWhatsApp } from '@/app/actions/whatsapp-actions';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VereditoPage() {
  const [cnj, setCnj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [model, setModel] = useState<string>('xai');
  const [apiError, setApiError] = useState<{ engine: string, message: string } | null>(null);
  const [sendingApi, setSendingApi] = useState(false);
  const isMounted = useRef(false);
  
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    isMounted.current = true;
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia') || 'xai';
    setModel(savedIA);
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cnj || loading) return;
    setLoading(true);
    setResult(null);
    setChatMessages([]);
    setApiError(null);
    try {
      const data = await executarVereditoAI({ cnj, preferredModel: model });
      if (isMounted.current) {
        setResult(data);
        toast({ title: "Auditoria Gerada" });
      }
    } catch (error: any) {
      if (isMounted.current) {
        setApiError({ engine: model, message: error.message });
        toast({ title: "Erro na Auditoria", description: "O motor falhou. Tente alternar o núcleo técnico.", variant: "destructive" });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleSwitchAndRetry = () => {
    const engines = ['xai', 'airforce', 'groq-llama', 'groq-deepseek'];
    const currentIndex = engines.indexOf(model);
    const nextIA = engines[(currentIndex + 1) % engines.length];
    
    setModel(nextIA);
    localStorage.setItem('lexisPredict_preferred_ia', nextIA);
    setApiError(null);
    toast({ title: "Motor Alternado", description: `Migrando para ${nextIA.toUpperCase()}...` });
    setTimeout(() => handleSearch(), 500);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !result) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const context = `Contexto Procedural. DataJud: ${JSON.stringify(result.dataJudRaw)}. Resumo: ${result.resumoTecnico}. Pergunta: ${chatInput}`;
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

  const handleApiSend = async () => {
    if (!result || !result.mensagemCliente || sendingApi) return;
    const phone = result.dataJudRaw?.contatoTelefone || "";
    if (!phone) {
      toast({ title: "Telefone Ausente", variant: "destructive" });
      return;
    }
    setSendingApi(true);
    const res = await sendYCloudWhatsApp(phone, result.mensagemCliente);
    setSendingApi(false);
    if (res.success) toast({ title: "Enviado via API" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado" });
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-black relative z-20">
        <header className="h-auto bg-white border-b border-[#dddbda] px-6 py-4 lg:py-6 shrink-0 z-40">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-center gap-4 lg:gap-6 pl-10 lg:pl-0">
              <div className="icon-3d-wrapper shrink-0 scale-75 lg:scale-100">
                <div className="icon-3d-block black w-10 lg:w-14 h-10 lg:h-14 rounded-md">
                  <FileSearch size={32} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-[9px] lg:text-[11px] font-black uppercase tracking-widest opacity-60">Auditoria 3D Elite</p>
                <h1 className="text-sm lg:text-xl font-black uppercase truncate max-w-[200px] lg:max-w-none">
                  {result ? `Processo ${result.dataJudRaw?.numeroProcesso}` : "Nova Triagem Técnica"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={model} onValueChange={(val) => { setModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                <SelectTrigger className="w-[180px] border-2 border-black font-black uppercase text-[10px] h-10 rounded-none bg-white">
                  <SelectValue placeholder="Motor Neural" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-black rounded-none">
                  <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 4.5</SelectItem>
                  <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek</SelectItem>
                  <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3</SelectItem>
                  <SelectItem value="groq-deepseek" className="font-black uppercase text-[10px]">Groq DeepSeek R1</SelectItem>
                </SelectContent>
              </Select>
              {result && (
                <Badge className="bg-black text-white font-black uppercase text-[8px] lg:text-[10px] px-2 lg:px-3 py-1 border-none flex items-center gap-1 whitespace-nowrap rounded-none">
                  <Zap size={10} className="text-yellow-500 fill-yellow-500" /> Active
                </Badge>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-30">
          <div className="max-w-7xl mx-auto space-y-6">
            {!result && (
              <div className="max-w-2xl mx-auto py-12 lg:py-20 text-center space-y-8">
                {apiError && (
                  <Alert variant="destructive" className="border-2 border-red-600 bg-red-50 rounded-none shadow-[4px_4px_0px_#000] text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-xs">Erro de Triagem</AlertTitle>
                    <AlertDescription className="flex flex-col gap-3 mt-2">
                      <p className="text-[10px] font-bold uppercase">O motor {apiError.engine.toUpperCase()} falhou. Tentando alternar...</p>
                      <Button onClick={handleSwitchAndRetry} className="bg-red-600 text-white border-2 border-black h-9 font-black uppercase text-[9px] rounded-none hover:bg-black transition-all w-fit px-6">
                        Trocar Motor & Re-tentar
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <h2 className="text-xl lg:text-3xl font-black tracking-tighter uppercase">Unidade de Triagem Técnica</h2>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-none border-2 border-black shadow-xl relative z-50">
                  <Input 
                    placeholder="CNJ (20 DÍGITOS)..." 
                    value={cnj} 
                    onChange={(e) => setCnj(e.target.value)} 
                    className="border-none h-12 lg:h-14 text-sm lg:text-lg focus-visible:ring-0 font-mono text-black bg-white rounded-none flex-1" 
                  />
                  <Button type="submit" disabled={loading} className="h-12 lg:h-14 px-8 rounded-none bg-black text-white font-black uppercase text-[10px] border-2 border-black">
                    {loading ? "Auditando..." : "Realizar Auditoria"}
                  </Button>
                </form>
              </div>
            )}

            {result && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
                <div className="lg:col-span-2 space-y-6">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="bg-[#e2e2e2] p-1 h-11 w-full justify-start rounded-none mb-0 border-2 border-black border-b-0 overflow-x-auto">
                      <TabsTrigger value="details" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-[10px] lg:text-xs px-4 lg:px-6 h-9 uppercase rounded-none">Parecer de Gabinete</TabsTrigger>
                      <TabsTrigger value="whatsapp" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-[10px] lg:text-xs px-4 lg:px-6 h-9 uppercase rounded-none">Comunicação WhatsApp</TabsTrigger>
                      <TabsTrigger value="chatter" className="data-[state=active]:bg-black data-[state=active]:text-white font-black text-[10px] lg:text-xs px-4 lg:px-6 h-9 uppercase rounded-none">Consultoria Neural</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-0">
                      <Card className="bg-white border-2 border-black shadow-none rounded-none border-t-0 overflow-hidden">
                        <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                          <CardTitle className="text-[9px] lg:text-[10px] font-black text-black uppercase flex items-center gap-2">
                            <FileText size={14} /> Diagnóstico Estratégico Senior
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6 space-y-8">
                          <div className="space-y-2 p-4 bg-[#f3f2f2] border-2 border-black">
                            <Label className="text-[9px] lg:text-[10px] font-black uppercase">Resumo Resolutivo</Label>
                            <p className="text-xs lg:text-sm leading-relaxed text-black font-black uppercase italic">{result.resumoTecnico}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                            <div className="space-y-2">
                              <Label className="text-[9px] lg:text-[10px] font-black uppercase text-red-600">Análise de Risco (Cláusula 3.2)</Label>
                              <p className="text-[10px] lg:text-xs text-black leading-relaxed border-l-4 border-black pl-4 font-black uppercase">{result.analiseRisco}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] lg:text-[10px] font-black uppercase">Estratégia de Gabinete</Label>
                              <p className="text-[10px] lg:text-xs text-black leading-relaxed border-l-4 border-black pl-4 font-black uppercase">{result.proximosPassos}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="whatsapp" className="mt-0">
                       <Card className="bg-white border-2 border-black shadow-none rounded-none border-t-0 overflow-hidden">
                        <CardHeader className="bg-green-50 border-b-2 border-black py-3">
                          <CardTitle className="text-[9px] lg:text-[10px] font-black text-green-800 uppercase flex items-center gap-2">
                            <MessageCircle size={14} /> Despacho para o Cliente
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-8 space-y-6">
                           <div className="bg-[#f9f9f9] border-2 border-dashed border-black/10 p-4 lg:p-6 rounded-none relative">
                              <p className="text-xs lg:text-sm text-black font-black uppercase leading-relaxed italic">{result.mensagemCliente}</p>
                              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.mensagemCliente)} className="absolute top-2 right-2"><Copy size={14} /></Button>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-4">
                              <Button disabled={sendingApi} onClick={handleApiSend} className="flex-1 h-12 bg-black text-white border-2 border-black font-black uppercase text-[9px] lg:text-[10px] rounded-none">
                                {sendingApi ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2 text-yellow-500 fill-yellow-500" />}
                                Disparo API Profissional
                              </Button>
                              <Button asChild className="flex-1 h-12 bg-white text-black border-2 border-black font-black uppercase text-[9px] lg:text-[10px] rounded-none">
                                <a href={formatWhatsAppLink('', result.mensagemCliente)} target="_blank" rel="noopener noreferrer">
                                  <MessageCircle size={16} className="mr-2" /> Link WhatsApp Manual
                                </a>
                              </Button>
                           </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="chatter" className="mt-0">
                      <Card className="bg-white border-2 border-black shadow-lg rounded-none border-t-0 flex flex-col h-[400px] lg:h-[500px] overflow-hidden">
                        <ScrollArea className="flex-1 p-4 bg-[#f3f2f2]" ref={scrollRef}>
                          <div className="space-y-4">
                            {chatMessages.map((msg, i) => (
                              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                  "p-3 rounded-none max-w-[90%] shadow-sm text-[9px] lg:text-[10px] font-black uppercase border-2",
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
                            <Input placeholder="INSIRA SUA DÚVIDA TÉCNICA..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-[#f3f2f2] border-2 border-black text-[10px] font-black uppercase rounded-none" />
                            <Button type="submit" size="icon" className="bg-black text-white border-2 border-black rounded-none">
                              <Send size={16} />
                            </Button>
                          </form>
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="space-y-6">
                   <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                         <CardTitle className="text-[9px] lg:text-[10px] font-black text-black uppercase flex items-center gap-2">
                            <History size={14} /> Cronologia Processual
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                         <div className="divide-y-2 divide-black/5 max-h-[400px] lg:max-h-[600px] overflow-auto">
                            {result.dataJudRaw?.movimentos?.slice(0, 20).map((m: any, i: number) => (
                               <div key={i} className="p-4 hover:bg-black group transition-all">
                                  <div className="flex items-center gap-2 mb-1">
                                     <Clock size={10} className="text-black/40 group-hover:text-white/40" />
                                     <span className="text-[8px] lg:text-[9px] font-black text-black/60 group-hover:text-white/60 uppercase">
                                       {m.dataHora ? new Date(m.dataHora).toLocaleDateString('pt-BR') : 'S/ DATA'}
                                     </span>
                                  </div>
                                  <p className="text-[9px] lg:text-[10px] font-black text-black group-hover:text-white uppercase leading-tight">{m.nome}</p>
                               </div>
                            ))}
                         </div>
                      </CardContent>
                   </Card>
                </div>
              </div>
            )}
          </div>
        </div>
        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-4 lg:gap-6 text-[8px] lg:text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 z-40">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
        </footer>
      </main>
    </div>
  );
}
