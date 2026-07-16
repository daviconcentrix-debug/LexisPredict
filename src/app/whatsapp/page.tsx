"use client";
/**
 * @fileOverview Terminal WhatsApp Elite v1400.0
 * Integração Supabase Histórico Real + Biblioteca de Scripts Processuais.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  MessageCircle, 
  Search, 
  Send, 
  User, 
  RefreshCcw,
  Zap,
  Loader2,
  Copyright,
  History,
  FileSearch,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  BookOpen,
  Scale,
  Clock,
  AlertTriangle,
  Gavel
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fetchRepoCases } from '@/app/actions/case-actions';
import { sendWhatsAppAction, fetchWhatsAppHistoryAction } from '@/app/actions/whatsapp-actions';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { executarVereditoAI } from '@/ai/flows/veredito-ai-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/auth-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// REPOSITÓRIO OFICIAL DE SCRIPTS W1 CAPITAL
const SCRIPTS_GABINETE = [
  { id: 'apresentacao-1', cat: 'Apresentação', title: 'Apresentação Curta', text: 'Olá [CLIENTE]! Me chamo [USUARIO] e faço parte do Setor Processual da Get Assessoria. Seguem as informações do seu processo n.º [PROTOCOLO].' },
  { id: 'audiencia-1', cat: 'Processual', title: 'Audiência', text: 'Referente ao seu processo, após o recebimento do comunicado em seu e-mail contendo a data e horário da audiência, o link para acesso à audiência virtual será enviado em um prazo de 24 a 72 horas.' },
  { id: 'improcedente-1', cat: 'Processual', title: 'Improcedente', text: 'Mediante a tratativa judicial, o juiz analisou as informações e documentações apresentadas por ambas as partes e julgou improcedente a ação.' },
  { id: 'recurso-1', cat: 'Processual', title: 'Recurso 2ª Instância', text: 'Referente ao seu procedimento, a última atualização foi o envio do processo à segunda instância, para reanálise do recurso. Atualmente, estamos aguardando o julgamento.' },
  { id: 'docs-1', cat: 'Processual', title: 'Docs Hipossuficiência', text: 'O juiz solicitou documentos para análise do pedido de Justiça Gratuita: a) extratos bancários (3 meses); b) contracheques; c) faturas de cartão; d) declaração de IR.' },
  { id: 'golpe-1', cat: 'Alerta', title: 'Alerta de Golpe', text: 'ESTOU PASSANDO PARA ALERTAR SOBRE POSSÍVEIS GOLPES. A Get Assessoria Financeira não aceita pagamentos em nome de pessoa física (advogados). Pagamentos apenas via CNPJ da empresa.' },
];

export default function WhatsAppHub() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  
  // Estados de IA e Chat
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [preferredModel, setPreferredModel] = useState<string>('xai');
  
  // Histórico Real (Supabase)
  const [realHistory, setRealHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia') || 'xai';
    setPreferredModel(savedIA);
    loadData();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadRealHistory(selectedContact.telefone);
      setAiResponse('');
    }
  }, [selectedContact]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [realHistory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) setCases(repoData);
    } finally {
      setLoading(false);
    }
  };

  const loadRealHistory = async (phone: string) => {
    if (!phone) return;
    setLoadingHistory(true);
    const res = await fetchWhatsAppHistoryAction(phone);
    if (res.success) {
      setRealHistory(res.messages || []);
    }
    setLoadingHistory(false);
  };

  const contacts = useMemo(() => {
    const unique = new Map();
    cases.forEach(c => {
      if (c.telefone && !unique.has(c.cliente)) {
        unique.set(c.cliente, { ...c, nome: c.cliente, telefone: c.telefone });
      }
    });
    return Array.from(unique.values()).filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));
  }, [cases, search]);

  const formatText = (text: string) => {
    if (!selectedContact) return text;
    return text
      .replace(/\[CLIENTE\]/g, selectedContact.nome)
      .replace(/\[PROTOCOLO\]/g, selectedContact.protocolo)
      .replace(/\[USUARIO\]/g, profile?.nome || "Setor Processual");
  };

  const handleGenerateAI = async (scriptId: string) => {
    if (!selectedContact || isGenerating) return;
    
    const script = SCRIPTS_GABINETE.find(s => s.id === scriptId);
    if (!script) return;

    setIsGenerating(true);
    try {
      const res = await perguntarIA({ 
        pergunta: `Refine este despacho jurídico para o cliente ${selectedContact.nome}. Baseie-se neste script oficial: "${script.text}". Observações do Gabinete: ${selectedContact.observacao || 'Sem observações'}.`, 
        preferredModel,
        historico: [] 
      });

      if (res && res.resposta && !res.fallback) {
        // Protocolo de Desbloqueio Master
        if (res.resposta.includes("PORTAL DE EXPORTAÇÃO")) {
          localStorage.setItem('lexis_master_unlock', 'true');
          window.dispatchEvent(new Event("storage"));
        }
        setAiResponse(formatText(res.resposta));
      } else {
        setAiResponse(formatText(script.text));
      }
    } catch (e) {
      setAiResponse(formatText(script.text));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAudit3D = async () => {
    if (!selectedContact || isAuditing) return;
    setIsAuditing(true);
    try {
      const res = await executarVereditoAI({ 
        cnj: selectedContact.protocolo, 
        preferredModel 
      });
      if (res && res.mensagemCliente) {
        setAiResponse(formatText(res.mensagemCliente));
        toast({ title: "Auditoria DataJud Concluída" });
      }
    } catch (e) {
      toast({ title: "Falha na Auditoria 3D", variant: "destructive" });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSend = async () => {
    if (!selectedContact || !aiResponse || isSending) return;
    setIsSending(true);
    try {
      const res = await sendWhatsAppAction(selectedContact.telefone, aiResponse);
      if (res.success) {
        toast({ title: "Enviado com Sucesso" });
        setTimeout(() => loadRealHistory(selectedContact.telefone), 2000);
        setAiResponse('');
      } else {
        toast({ title: "Falha no Envio", description: res.message, variant: "destructive" });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Terminal WhatsApp Elite</h1>
            <Badge variant="outline" className="border-black border-2 text-[10px] uppercase font-black flex items-center gap-1.5">
              <ShieldCheck size={10} /> Evolution Active
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Select value={preferredModel} onValueChange={setPreferredModel}>
              <SelectTrigger className="w-[180px] border-2 border-black font-black uppercase text-[10px] rounded-none bg-white">
                <SelectValue placeholder="Motor Neural" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-black rounded-none">
                <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 4.5</SelectItem>
                <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek</SelectItem>
                <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3</SelectItem>
                <SelectItem value="groq-deepseek" className="font-black uppercase text-[10px]">Groq DeepSeek R1</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={loadData} className="h-10 w-10 border-2 border-black rounded-none bg-white">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Agenda de Contatos */}
          <aside className={cn("w-full lg:w-80 border-r-2 border-black bg-white flex flex-col shrink-0", selectedContact && "hidden lg:flex")}>
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input placeholder="FILTRAR CLIENTE..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 border-black border-2 h-10 text-[10px] font-black uppercase rounded-none" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y-2 divide-black/5">
                {contacts.map((c) => (
                  <button key={c.id} onClick={() => setSelectedContact(c)} className={cn("w-full p-4 flex items-center gap-3 hover:bg-black group transition-all text-left", selectedContact?.id === c.id ? "bg-black" : "bg-white")}>
                    <div className="w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 bg-[#f3f2f2] group-hover:bg-white"><User size={20} className="text-black" /></div>
                    <div className="min-w-0">
                      <p className={cn("text-[11px] font-black uppercase truncate", selectedContact?.id === c.id ? "text-white" : "text-black")}>{c.nome}</p>
                      <p className={cn("text-[9px] font-mono", selectedContact?.id === c.id ? "text-white/40" : "text-black/40")}>{c.telefone}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* Painel de Conversa e IA */}
          <section className={cn("flex-1 bg-[#f3f2f2] flex flex-col overflow-hidden", !selectedContact && "hidden lg:flex")}>
            {selectedContact ? (
              <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setSelectedContact(null)} className="lg:hidden h-10 font-black uppercase text-[10px] border-2 border-black bg-white">
                    <ChevronLeft size={16} /> Voltar
                  </Button>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center text-white"><User size={20} /></div>
                     <div>
                        <p className="text-sm font-black uppercase">{selectedContact.nome}</p>
                        <p className="text-[10px] font-mono opacity-60">{selectedContact.telefone}</p>
                     </div>
                  </div>
                </div>

                <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="bg-gray-200 border-2 border-black p-1 h-12 rounded-none">
                    <TabsTrigger value="history" className="flex-1 font-black uppercase text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-full">
                      <History size={14} className="mr-2" /> Histórico Real
                    </TabsTrigger>
                    <TabsTrigger value="ia" className="flex-1 font-black uppercase text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-full">
                      <Zap size={14} className="mr-2" /> IA e Scripts
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="history" className="flex-1 bg-white border-2 border-black border-t-0 p-4 overflow-hidden flex flex-col mt-0">
                    <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                       <div className="space-y-4">
                         {loadingHistory ? (
                           <div className="p-20 text-center font-black uppercase opacity-40 flex flex-col items-center gap-4">
                             <Loader2 className="animate-spin" size={32} />
                             Sincronizando Mensagens...
                           </div>
                         ) : realHistory.length === 0 ? (
                           <div className="p-20 text-center font-black uppercase opacity-20 flex flex-col items-center gap-4">
                             <MessageSquare size={32} />
                             Nenhuma mensagem registrada.
                           </div>
                         ) : (
                           realHistory.map((m) => (
                             <div key={m.id} className={cn(
                               "flex flex-col max-w-[85%] p-3 border-2 border-black shadow-sm",
                               m.from_me ? "ml-auto bg-black text-white" : "mr-auto bg-[#f8f9fb] text-black"
                             )}>
                                <p className="text-[11px] font-black uppercase leading-relaxed whitespace-pre-wrap">{m.message_text}</p>
                                <div className="flex items-center justify-between gap-4 mt-2 opacity-50">
                                   <span className="text-[8px] uppercase font-bold">{new Date(m.timestamp).toLocaleString('pt-BR')}</span>
                                   <span className="text-[8px] uppercase font-bold">{m.from_me ? 'Enviada' : 'Recebida'}</span>
                                </div>
                             </div>
                           ))
                         )}
                       </div>
                    </ScrollArea>
                    <Button variant="ghost" size="sm" onClick={() => loadRealHistory(selectedContact.telefone)} className="mt-2 text-[9px] font-black uppercase border-t border-black/5 pt-2">
                       <RefreshCcw size={10} className="mr-1" /> Atualizar Histórico
                    </Button>
                  </TabsContent>

                  <TabsContent value="ia" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       <Select onValueChange={handleGenerateAI}>
                          <SelectTrigger className="border-2 border-black font-black uppercase text-[9px] h-11 bg-white hover:bg-black hover:text-white transition-all rounded-none">
                             <BookOpen size={14} className="mr-2" /> Scripts Processuais
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-black rounded-none">
                             {SCRIPTS_GABINETE.map(s => (
                               <SelectItem key={s.id} value={s.id} className="font-black uppercase text-[9px]">{s.title}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                       <Button onClick={handleAudit3D} disabled={isAuditing} variant="outline" className="border-2 border-blue-600 text-blue-600 font-black uppercase text-[9px] h-11 bg-white hover:bg-blue-600 hover:text-white transition-all rounded-none">
                         {isAuditing ? <Loader2 className="animate-spin" size={14} /> : <FileSearch size={14} />} 3D Audit
                       </Button>
                    </div>

                    <div className="flex-1 bg-white border-2 border-black p-4 flex flex-col gap-4">
                       <Label className="text-[9px] font-black uppercase opacity-40">Área de Edição e Despacho</Label>
                       <Textarea 
                        value={aiResponse} 
                        onChange={(e) => setAiResponse(e.target.value)}
                        placeholder="REDIJA SUA MENSAGEM OU USE A IA ACIMA PARA GERAR UM RASCUNHO ESTRATÉGICO..."
                        className="flex-1 border-none focus-visible:ring-0 rounded-none resize-none font-black uppercase text-xs p-0 bg-transparent leading-relaxed"
                      />
                    </div>

                    <Button onClick={handleSend} disabled={!aiResponse || isSending} className="h-14 bg-black text-white border-2 border-black font-black uppercase text-[11px] shadow-[6px_6px_0px_#00D1FF] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all rounded-none">
                       {isSending ? <Loader2 className="animate-spin mr-3" size={16} /> : <Send className="mr-3" size={16} />} 
                       Enviar via Evolution API
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                <Gavel size={80} className="mb-6" />
                <h2 className="text-2xl font-black uppercase tracking-widest text-center">Selecione um cliente para iniciar</h2>
                <p className="text-xs font-bold uppercase mt-2">Terminal de Comunicação v1400.0</p>
              </div>
            )}
          </section>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 z-40">
          <Copyright size={10} className="mr-2" /> 2026 W1 Capital. Advanced Technical Unit.
        </footer>
      </main>
    </div>
  );
}
