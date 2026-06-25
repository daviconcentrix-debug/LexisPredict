
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

  // Função ultra-resiliente para carregar PDF.js via CDN sem erros de build
  const loadPdfJs = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
      script.type = 'module';
      script.onload = () => {
        // PDF.js v4+ uses ESM. We need to handle the worker separately.
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
          resolve(pdfjs);
        } else {
          // Fallback if global is not set
          setTimeout(() => {
            const retry = (window as any).pdfjsLib;
            if (retry) resolve(retry);
            else reject(new Error("PDF.js não carregado corretamente."));
          }, 500);
        }
      };
      script.onerror = () => reject(new Error("Falha ao carregar motor de PDF."));
      document.head.appendChild(script);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfExtracting(true);
    try {
      // Carregamento dinâmico no navegador para evitar erros de Turbopack
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      if (!fullText.trim()) throw new Error("O PDF parece estar vazio ou é uma imagem (OCR não suportado).");

      setDocInput(fullText);
      toast({ title: "PDF Processado", description: "Texto extraído com sucesso para análise." });
    } catch (error: any) {
      console.error("PDF_EXTRACTION_FAILURE:", error);
      toast({ 
        title: "Erro no PDF", 
        description: "Falha ao processar arquivo. Tente colar o texto manualmente.", 
        variant: "destructive" 
      });
    } finally {
      setPdfExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnj || retryAfter !== null) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await executarVereditoAI({ cnj, preferredModel: model, deepThinking });
      setResult(data);
      toast({ title: "Análise Concluída", description: `Motor ${data.engineUtilizada} entregou o parecer.` });
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || retryAfter !== null) return;
    const msg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await perguntarIA({ pergunta: msg, preferredModel: model, deepThinking });
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.resposta, engine: res.engineUtilizada }]);
    } catch (error: any) {
      if (error.message.includes('RATE_LIMIT')) {
        const s = parseInt(error.message.split(':')[1]) || 25;
        setRetryAfter(s);
        toast({ title: "Limite do Motor", description: `Aguarde ${s}s.`, variant: "destructive" });
      } else {
        toast({ title: "Erro no Chat", description: error.message, variant: "destructive" });
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleDocGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docInput.trim() || docLoading || retryAfter !== null) return;
    setDocLoading(true);
    setDocResult(null);
    try {
      const res = await gerarDocumentoIA({ dadosBrutos: docInput, preferredModel: model });
      setDocResult(res.conteudoFormatado);
      toast({ title: "Documento Gerado", description: "Procuração preenchida com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro no Documento", description: error.message, variant: "destructive" });
    } finally {
      setDocLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    const cleanText = text.replace(/\[CENTER\]/g, '').replace(/\[\/CENTER\]/g, '');
    navigator.clipboard.writeText(cleanText);
    toast({ title: "Copiado com Sucesso!" });
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl">Veredito AI v10.0 Elite</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[9px] uppercase tracking-widest bg-primary/10 border-primary/20 text-primary">
                <Zap size={10} className="mr-1" /> {model === 'openrouter' ? 'CLAUDE 3.5 SONNET' : model.toUpperCase()}
              </Badge>
              {deepThinking && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px] animate-pulse uppercase tracking-widest">
                  <BrainCircuit size={10} className="mr-1" /> Deep Thinking
                </Badge>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="bg-secondary/50 mb-8 p-1 rounded-xl">
              <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-primary">Análise Estratégica</TabsTrigger>
              <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-primary">Chat Consultivo</TabsTrigger>
              <TabsTrigger value="docs" className="rounded-lg data-[state=active]:bg-primary">Gerador de Docs v10.0</TabsTrigger>
              <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-primary">Biblioteca</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-8">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-headline font-bold tracking-tighter">Assistente Jurídico CRM</h2>
                  <p className="text-muted-foreground text-sm">Insira o CNJ para gerar análise técnica e mensagem para o cliente.</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input 
                    placeholder="CNJ do Processo (Ex: 0000000-00.2025.8.26.0000)" 
                    value={cnj} 
                    onChange={(e) => setCnj(e.target.value)} 
                    className="bg-card border-border h-14 text-lg rounded-2xl focus-visible:ring-primary shadow-2xl" 
                  />
                  <button type="submit" disabled={loading || retryAfter !== null} className="h-14 px-10 rounded-2xl font-bold text-white shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all">
                    {loading ? (
                      <span className="flex items-center gap-2"><Clock className="animate-spin" size={18} /> Analisando...</span>
                    ) : retryAfter !== null ? (
                      <span className="text-destructive font-mono">{retryAfter}s</span>
                    ) : "Gerar Veredito"}
                  </button>
                </form>
              </div>

              {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-t-4 border-t-primary">
                      <CardHeader className="bg-secondary/20 border-b border-border/50 py-4 px-8">
                        <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                          <FileText size={14} /> 📋 Análise Interna (Estratégia Equipe)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status & Andamento Relevante</Label>
                          <div className="bg-secondary/30 p-6 rounded-2xl border border-border/50">
                            <p className="text-sm leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap">{result.resumoTecnico}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black text-accent uppercase tracking-widest">Alertas e Prazos</Label>
                            <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-accent pl-4 whitespace-pre-wrap">{result.analiseRisco}</p>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black text-chart-3 uppercase tracking-widest">Ações Práticas</Label>
                            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-chart-3 pl-4 whitespace-pre-wrap">{result.proximosPassos}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 shadow-2xl rounded-3xl border-l-8 border-l-primary overflow-hidden">
                      <CardHeader className="bg-primary/10 border-b border-primary/10 py-4 px-8 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                          <MessageSquare size={14} /> 💬 Mensagem para WhatsApp (CRM)
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
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <Card className="bg-card border-border shadow-xl rounded-3xl overflow-hidden">
                      <CardHeader className="bg-secondary/20 py-4 px-6 border-b border-border/50">
                        <CardTitle className="text-[10px] uppercase font-black tracking-tighter text-muted-foreground">Extração DataJud (Metadata)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Tribunal</span>
                          <span className="text-sm font-bold text-white">{result.dataJudRaw?.tribunal || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Órgão Julgador</span>
                          <span className="text-sm font-bold text-white">{result.dataJudRaw?.orgaoJulgador?.nome || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Classe</span>
                          <span className="text-sm font-bold text-white">{result.dataJudRaw?.classe?.nome || 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="h-[600px]">
              <div className="bg-card border border-border rounded-3xl h-full flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 bg-secondary/20 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <Bot size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Consultor Sênior W1</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Inteligência Estratégica</p>
                    </div>
                  </div>
                  {chatLoading && <Badge className="bg-primary/20 text-primary border-none animate-pulse">PENSANDO...</Badge>}
                </div>
                
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={cn("flex flex-col gap-2 max-w-[85%]", m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                        <div className={cn(
                          "p-5 rounded-2xl text-sm leading-relaxed shadow-lg",
                          m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none border border-border/50"
                        )}>
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          {m.engine && <div className="mt-4 pt-2 border-t border-white/10 text-[8px] opacity-50 uppercase font-black tracking-widest">{m.engine}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-border bg-sidebar/30 flex gap-3">
                  <Input 
                    placeholder="Sua pergunta jurídica..." 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    className="bg-secondary border-border h-12 rounded-xl focus-visible:ring-primary shadow-inner" 
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg" disabled={chatLoading || !chatInput.trim()}>
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="docs" className="space-y-8">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                      <FileSignature className="text-primary" /> Gerador de Procurações v10.0
                    </h2>
                    <p className="text-muted-foreground text-xs font-medium">Extração de dados cirúrgica via Texto ou PDF.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handlePdfUpload} 
                    />
                    <Button 
                      variant="outline" 
                      className="flex-1 border-primary/50 text-primary hover:bg-primary/10 h-12 font-bold"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pdfExtracting}
                    >
                      {pdfExtracting ? <Clock className="animate-spin mr-2" /> : <FileUp className="mr-2" />}
                      {pdfExtracting ? "Processando..." : "Carregar PDF"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-12 border border-border text-muted-foreground"
                      onClick={() => {
                        setDocInput('');
                        setDocResult(null);
                      }}
                    >
                      Limpar
                    </Button>
                  </div>

                  <Card className="bg-card border-border shadow-xl">
                    <CardContent className="p-6 space-y-4">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Dados do Contrato ou PDF Extraído</Label>
                      <Textarea 
                        placeholder="Cole aqui o texto ou carregue um PDF..." 
                        value={docInput}
                        onChange={(e) => setDocInput(e.target.value)}
                        className="bg-secondary/30 border-border min-h-[300px] text-sm resize-none focus-visible:ring-primary"
                      />
                      <button 
                        onClick={handleDocGenerate} 
                        disabled={docLoading || !docInput.trim() || retryAfter !== null}
                        className="w-full h-14 font-bold text-white shadow-lg bg-primary hover:bg-primary/90 rounded-2xl disabled:opacity-50 transition-all"
                      >
                        {docLoading ? (
                          <span className="flex items-center gap-2"><Clock className="animate-spin" size={16} /> Gerando...</span>
                        ) : "Gerar Procuração Elite"}
                      </button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
                      <FileCheck size={14} className="text-chart-3" /> Preview Documento (.docx)
                    </Label>
                    {docResult && (
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(docResult)} className="text-primary text-[10px] font-bold uppercase">
                        <Copy size={12} className="mr-1" /> Copiar para Word
                      </Button>
                    )}
                  </div>
                  
                  {docResult ? (
                    <div className="space-y-4 animate-in zoom-in-95 duration-300">
                      <div className="bg-white text-black p-12 rounded-lg shadow-2xl min-h-[700px] font-serif text-[12px] leading-relaxed border border-gray-200 overflow-hidden">
                        {docResult.split('\n').map((line, i) => {
                          const isCentered = line.includes('[CENTER]');
                          const cleanLine = line.replace(/\[CENTER\]/g, '').replace(/\[\/CENTER\]/g, '');
                          
                          if (!cleanLine.trim()) return <div key={i} className="h-4" />;

                          return (
                            <div key={i} className={cn(
                              "mb-1",
                              isCentered && "text-center"
                            )}>
                              {cleanLine.split('**').map((part, idx) => (
                                idx % 2 === 1 ? <strong key={idx} className="font-bold">{part}</strong> : part
                              ))}
                            </div>
                          );
                        })}
                      </div>
                      <Button onClick={() => copyToClipboard(docResult)} className="w-full h-12 bg-chart-3 hover:bg-chart-3/90 font-bold text-white shadow-lg">
                        <Copy size={16} className="mr-2" /> Copiar Formatação Final
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-xl h-[700px] flex flex-col items-center justify-center opacity-30 text-center p-8 bg-secondary/10">
                      <FileSignature size={64} className="mb-4 text-muted-foreground" />
                      <p className="text-sm font-bold">Preview do documento oficial.</p>
                      <p className="text-[10px] mt-2">Extração automática e formatação rigorosa v10.0.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {RESPONSE_TEMPLATES.map((cat, idx) => (
                  <div key={idx} className="space-y-4">
                    <h3 className="text-xs uppercase font-black text-primary tracking-widest mb-4 flex items-center gap-2">
                      <div className="h-1 w-4 bg-primary rounded-full" /> {cat.category}
                    </h3>
                    <div className="space-y-3">
                      {cat.items.map((item, iidx) => (
                        <Card key={iidx} className="bg-card border-border hover:border-primary/50 transition-all group rounded-2xl cursor-default">
                          <CardHeader className="p-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">{item.title}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.text)} className="h-8 w-8 hover:bg-primary/10 text-muted-foreground group-hover:text-primary">
                              <Copy size={14} />
                            </Button>
                          </CardHeader>
                          <CardContent className="px-4 pb-4">
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.text}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
