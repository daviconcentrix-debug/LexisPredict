"use client";
/**
 * @fileOverview Terminal WhatsApp Elite v2100.0
 * Integração Supabase Histórico Real + Triagem de Tribunal Cópia/Cola.
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
  Gavel,
  CheckCircle2,
  AlertCircle
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

// REPOSITÓRIO OFICIAL DE SCRIPTS ELITE W1 CAPITAL
const SCRIPTS_GABINETE = [
  { id: 'apresentacao', cat: 'Apresentação', title: 'Apresentação Padrão', text: 'Olá [CLIENTE]! Me chamo [USUARIO] e faço parte do Setor Processual da Get Assessoria. Seguem as informações do seu processo n.º [PROTOCOLO].' },
  { id: 'audiencia', cat: 'Processual', title: 'Audiência Procedimento', text: 'Após o recebimento do comunicado em seu e-mail contendo a data e horário da audiência, o link para acesso à audiência virtual será enviado em um prazo de 24 a 72 horas. Na audiência serão apresentados o advogado da assessoria, representantes do banco, o mediador e o juiz.' },
  { id: 'extrajudicial-falha', cat: 'Processual', title: 'Falha Extrajudicial', text: 'Mediante ao prazo de 7 dias úteis que a financeira tinha para nos retornar, ela encerrou a comunicação na esfera extrajudicial sem motivo. Dessa forma, nosso jurídico já deu seguimento na esfera judicial para tratar perante ao juiz seu pedido de revisão contratual.' },
  { id: 'improcedente', cat: 'Processual', title: 'Sentença Improcedente', text: 'Mediante a tratativa judicial, o juiz analisou as informações e documentações e julgou improcedente a ação. O advogado irá analisar a sentença e avaliar a possibilidade de apresentar recurso para discutir os pontos decididos.' },
  { id: 'recurso-2inst', cat: 'Processual', title: 'Recurso 2ª Instância', text: 'Referente ao seu procedimento, a última atualização foi o envio do processo à segunda instância, para reanálise do recurso. Atualmente, estamos aguardando o julgamento.' },
  { id: 'demora', cat: 'Atenção', title: 'Justificativa Demora', text: 'Entendo a sua preocupação com a demora. Neste momento o processo está na fase de análise do juiz. Infelizmente não existe um prazo específico para que ele profira a decisão, pois cada magistrado tem sua própria demanda de processos.' },
  { id: 'justica-negada', cat: 'Financeiro', title: 'Justiça Gratuita Negada', text: 'O juiz analisou o pedido de justiça gratuita porém entendeu que seu perfil possui condições de pagar as taxas judiciárias. Essas custas são revertidas para serviços do fórum, cartório e diário oficial. Irei solicitar ao setor responsável a emissão da guia.' },
  { id: 'eproc-cancelado', cat: 'Atenção', title: 'Migração Eproc', text: 'O TJSP está mudando para o sistema Eproc. Se o senhor consultar o número antigo e aparecer "Cancelado", não se assuste. Isso indica apenas que o processo foi transferido para a nova plataforma, onde já estamos habilitados acompanhando tudo.' },
  { id: 'golpe-alerta', cat: 'Alerta', title: 'Alerta de Golpe', text: 'A Get Assessoria Financeira não aceita pagamentos em nome de pessoa física (advogados). Pagamentos apenas via CNPJ oficial da empresa ou guias oficiais do Tribunal.' },
  { id: 'hipo-docs', cat: 'Documentos', title: 'Docs Hipossuficiência', text: 'Referente ao seu processo, o juiz solicitou alguns documentos para análise da Justiça Gratuita: a) Extratos bancários 3 meses; b) Holerite; c) Faturas cartão; d) Imposto de Renda ou print do e-CAC comprovando não entrega.' },
  { id: 'contestacao', cat: 'Processual', title: 'Contestação do Banco', text: 'Referente ao seu procedimento, a instituição financeira apresentou a contestação. Aguardaremos a manifestação do juiz sobre os próximos passos.' },
  { id: 'replica', cat: 'Processual', title: 'Fase de Réplica', text: 'Após a contestação do banco, o juiz nos intimou para apresentar a réplica para rebater os pontos alegados pela financeira.' },
  { id: 'savio-docs', cat: 'Específico', title: 'Sávio (Cobrança Docs)', text: 'Bom dia, Sr. Sávio! Passando para fazer um acompanhamento. O senhor deve continuar mantendo o pagamento das parcelas em dia junto ao banco. Sobre a documentação com firma reconhecida, gostaria de confirmar se o senhor já realizou o envio?' },
  { id: 'kely-retencao', cat: 'Específico', title: 'Kely (Retenção RA)', text: 'Kely, entendo perfeitamente sua insatisfação sobre a taxa do perito. Reconheço que a clareza deveria ter sido maior na venda. Como já recuperamos seu seguro, gostaríamos de saber como prefere seguir para se sentir confortável conosco.' }
];

export default function WhatsAppHub() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  
  // IA e Chat
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [preferredModel, setPreferredModel] = useState<string>('xai');
  
  // Triagem por Cópia/Cola
  const [courtHistoryRaw, setCourtHistoryRaw] = useState('');
  
  // Histórico Real
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
      setCourtHistoryRaw('');
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
    // Normalização agressiva para garantir busca por DDI 55
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
       cleanPhone = `55${cleanPhone}`;
    }
    
    setLoadingHistory(true);
    try {
      const res = await fetchWhatsAppHistoryAction(cleanPhone);
      if (res.success) {
        setRealHistory(res.messages || []);
      }
    } catch (e) {
      console.error("History fail:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const contacts = useMemo(() => {
    const unique = new Map();
    cases.forEach(c => {
      if (c.telefone && !unique.has(c.cliente)) {
        unique.set(c.cliente, { ...c, nome: c.cliente, telefone: c.telefone });
      }
    });
    return Array.from(unique.values()).filter(c => 
      c.nome.toLowerCase().includes(search.toLowerCase()) || 
      c.telefone.includes(search)
    );
  }, [cases, search]);

  const formatText = (text: string) => {
    if (!selectedContact) return text;
    return text
      .replace(/\[CLIENTE\]/g, selectedContact.nome)
      .replace(/\[PROTOCOLO\]/g, selectedContact.protocolo)
      .replace(/\[USUARIO\]/g, profile?.nome || "Setor Processual");
  };

  const handleSelectScript = async (scriptId: string) => {
    if (!selectedContact || isGenerating) return;
    const script = SCRIPTS_GABINETE.find(s => s.id === scriptId);
    if (!script) return;

    const baseText = formatText(script.text);
    setAiResponse(baseText);

    // Opcionalmente refina com IA
    setIsGenerating(true);
    try {
      const res = await perguntarIA({ 
        pergunta: `Como Setor Processual, refine este script para o cliente ${selectedContact.nome}: "${baseText}". Observações: ${selectedContact.observacao || 'Nenhuma'}. Assine como [USUARIO].`, 
        preferredModel,
        historico: [] 
      });
      if (res && res.resposta && !res.engineUtilizada.includes('FALLBACK')) {
        setAiResponse(formatText(res.resposta));
      }
    } catch (e) {
      // Mantém o texto base em caso de erro
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAudit3D = async () => {
    if (!selectedContact || isAuditing) return;
    setIsAuditing(true);
    try {
      const res = await executarVereditoAI({ cnj: selectedContact.protocolo, preferredModel });
      if (res && res.mensagemCliente) {
        setAiResponse(formatText(res.mensagemCliente));
        toast({ title: "Audit 3D Concluído" });
      } else {
        toast({ title: "Dados não encontrados", description: "Audit 3D não localizou o processo no DataJud.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Falha técnica no Audit 3D", variant: "destructive" });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAnalyzeCourtHistory = async () => {
    if (!selectedContact || !courtHistoryRaw.trim() || isAuditing) return;
    setIsAuditing(true);
    try {
      const res = await executarVereditoAI({ 
        cnj: selectedContact.protocolo, 
        historicoBruto: courtHistoryRaw,
        preferredModel 
      });
      if (res && res.mensagemCliente) {
        setAiResponse(formatText(res.mensagemCliente));
        toast({ title: "Histórico Analisado" });
      }
    } catch (e) {
      toast({ title: "Erro na Triagem", variant: "destructive" });
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
        toast({ title: "Mensagem Enviada" });
        // Recarrega histórico após envio
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Terminal WhatsApp v21.0</h1>
            <Badge variant="outline" className="border-black border-2 text-[10px] font-black rounded-none">Grok 4.5 Active</Badge>
          </div>
          <div className="flex items-center gap-3">
             <Select value={preferredModel} onValueChange={setPreferredModel}>
              <SelectTrigger className="w-[180px] border-2 border-black font-black uppercase text-[10px] rounded-none bg-white h-10">
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
          <aside className={cn("w-full lg:w-80 border-r-2 border-black bg-white flex flex-col shrink-0", selectedContact && "hidden lg:flex")}>
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input placeholder="BUSCAR CONTATO..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 border-black border-2 h-11 text-[10px] font-black uppercase rounded-none" />
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

          <section className={cn("flex-1 bg-[#f3f2f2] flex flex-col overflow-hidden", !selectedContact && "hidden lg:flex")}>
            {selectedContact ? (
              <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setSelectedContact(null)} className="lg:hidden h-10 font-black uppercase text-[10px] border-2 border-black bg-white">
                    <ChevronLeft size={16} /> Voltar
                  </Button>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center text-white rounded-none"><User size={20} /></div>
                     <div>
                        <p className="text-sm font-black uppercase leading-none">{selectedContact.nome}</p>
                        <p className="text-[10px] font-mono opacity-60 mt-1">{selectedContact.telefone}</p>
                     </div>
                  </div>
                </div>

                <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="bg-gray-200 border-2 border-black p-1 h-12 rounded-none shrink-0">
                    <TabsTrigger value="history" className="flex-1 font-black uppercase text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-full rounded-none">Histórico Real</TabsTrigger>
                    <TabsTrigger value="ia" className="flex-1 font-black uppercase text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-full rounded-none">Scripts Elite</TabsTrigger>
                  </TabsList>

                  <TabsContent value="history" className="flex-1 bg-white border-2 border-black border-t-0 p-4 overflow-hidden flex flex-col mt-0">
                    <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                       <div className="space-y-4">
                         {loadingHistory ? (
                           <div className="p-20 text-center font-black uppercase opacity-40 flex flex-col items-center gap-4">
                             <Loader2 className="animate-spin" size={32} />
                             Sincronizando...
                           </div>
                         ) : realHistory.length === 0 ? (
                           <div className="p-20 text-center font-black uppercase opacity-20 flex flex-col items-center gap-4">
                             <MessageSquare size={32} />
                             Nenhuma mensagem registrada.
                           </div>
                         ) : (
                           realHistory.map((m) => (
                             <div key={m.id} className={cn(
                               "flex flex-col max-w-[85%] p-4 border-2 border-black shadow-sm",
                               m.from_me ? "ml-auto bg-black text-white" : "mr-auto bg-[#f8f9fb] text-black"
                             )}>
                                <p className="text-[11px] font-black uppercase leading-relaxed whitespace-pre-wrap">{m.message_text}</p>
                                <div className="flex items-center justify-between gap-4 mt-3 opacity-50 border-t border-current pt-2">
                                   <span className="text-[8px] uppercase font-black">{new Date(m.timestamp).toLocaleString('pt-BR')}</span>
                                   <span className="text-[8px] uppercase font-black">{m.from_me ? 'Gabinete' : m.contact_name || 'Cliente'}</span>
                                </div>
                             </div>
                           ))
                         )}
                       </div>
                    </ScrollArea>
                    <Button variant="ghost" size="sm" onClick={() => loadRealHistory(selectedContact.telefone)} className="mt-4 text-[9px] font-black uppercase border-t-2 border-black/5 pt-4 hover:bg-black hover:text-white transition-all rounded-none h-10">
                       <RefreshCcw size={10} className="mr-1" /> Acordar App & Sincronizar
                    </Button>
                  </TabsContent>

                  <TabsContent value="ia" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label className="text-[9px] font-black uppercase">1. Selecionar Roteiro de Apoio</Label>
                         <Select onValueChange={handleSelectScript}>
                            <SelectTrigger className="border-2 border-black font-black uppercase text-[9px] h-11 bg-white hover:bg-black hover:text-white transition-all rounded-none">
                               <BookOpen size={14} className="mr-2" /> Selecionar Roteiro
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                               {SCRIPTS_GABINETE.map(s => (
                                 <SelectItem key={s.id} value={s.id} className="font-black uppercase text-[9px]">{s.title}</SelectItem>
                               ))}
                            </SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-2">
                         <Label className="text-[9px] font-black uppercase text-blue-600">2. Ferramentas de Auditoria</Label>
                         <div className="flex gap-2">
                            <Button onClick={handleAudit3D} disabled={isAuditing} variant="outline" className="flex-1 border-2 border-blue-600 text-blue-600 font-black uppercase text-[9px] h-11 bg-white hover:bg-blue-600 hover:text-white transition-all rounded-none">
                              {isAuditing ? <Loader2 className="animate-spin" size={14} /> : <Scale size={14} />} DataJud 3D
                            </Button>
                         </div>
                       </div>
                    </div>

                    <div className="bg-white border-2 border-black p-4 space-y-3">
                       <div className="flex items-center justify-between">
                          <Label className="text-[9px] font-black uppercase opacity-40">Triagem de Histórico (Cópia/Cola Tribunal)</Label>
                          <Badge variant="outline" className="border-black text-[8px] font-black uppercase rounded-none">E-SAJ / PJE</Badge>
                       </div>
                       <Textarea 
                         placeholder="COLE AQUI AS MOVIMENTAÇÕES DO TRIBUNAL PARA QUE A IA REDIJA O DESPACHO..."
                         value={courtHistoryRaw}
                         onChange={(e) => setCourtHistoryRaw(e.target.value)}
                         className="min-h-[100px] border-none focus-visible:ring-0 rounded-none resize-none font-black uppercase text-[10px] p-0 bg-transparent leading-relaxed"
                       />
                       <Button onClick={handleAnalyzeCourtHistory} disabled={!courtHistoryRaw.trim() || isAuditing} className="w-full h-10 bg-blue-600 text-white font-black uppercase text-[9px] rounded-none border-2 border-black hover:bg-black transition-all">
                          {isAuditing ? <Loader2 className="animate-spin mr-2" size={12} /> : <Zap size={12} className="mr-2" />} Analisar Histórico & Gerar Resposta
                       </Button>
                    </div>

                    <div className="flex-1 bg-white border-2 border-black p-4 flex flex-col gap-4 overflow-hidden">
                       <div className="flex items-center justify-between border-b border-black/5 pb-2">
                          <Label className="text-[9px] font-black uppercase opacity-40">Área de Redação</Label>
                          {isGenerating && <div className="flex items-center gap-2 text-primary animate-pulse"><Loader2 size={10} className="animate-spin" /><span className="text-[8px] font-black uppercase">IA Refinando...</span></div>}
                       </div>
                       <Textarea 
                        value={aiResponse} 
                        onChange={(e) => setAiResponse(e.target.value)}
                        placeholder="REDIJA SUA MENSAGEM OU SELECIONE UM SCRIPT ACIMA..."
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
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-10 text-center">
                <div className="icon-3d-wrapper mb-8">
                   <div className="icon-3d-block black w-24 h-24 rounded-none flex items-center justify-center border-4 border-black">
                      <MessageCircle size={48} className="text-white" />
                   </div>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Selecione um contato</h2>
                <p className="text-[10px] font-bold uppercase mt-4 tracking-widest max-w-sm leading-relaxed">
                   Terminal de Comunicação v21.0 Elite.<br/>
                   Sincronizado com Evolution API e Supabase.
                </p>
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
