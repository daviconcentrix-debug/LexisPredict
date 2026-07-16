"use client";
/**
 * @fileOverview Terminal WhatsApp Elite v910.0
 * Resiliência Total: IA Sênior com Fallback para Scripts Estáticos + Auditoria 3D (DataJud).
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
  Bot,
  Scale,
  FileText,
  Clock,
  Sparkles,
  ChevronLeft,
  BookOpen,
  Copy,
  History,
  BrainCircuit,
  Info,
  ShieldCheck,
  FileSearch,
  AlertCircle
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchRepoCases } from '@/app/actions/case-actions';
import { sendWhatsAppAction } from '@/app/actions/whatsapp-actions';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { executarVereditoAI } from '@/ai/flows/veredito-ai-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/auth-provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// REPOSITÓRIO OFICIAL DE SCRIPTS W1 CAPITAL (GET ASSESSORIA)
const SCRIPTS_GABINETE = [
  { id: 'apresentacao-1', cat: 'Apresentação', title: 'Apresentação Curta', text: 'Me chamo [USUARIO] e faço parte do Setor Processual da Get Assessoria. Segue as informações do seu processo.' },
  { id: 'apresentacao-2', cat: 'Apresentação', title: 'Apresentação Cordial', text: 'Muito prazer, me chamo [USUARIO], faço parte do Setor Processual da Get Assessoria. Irei te auxiliar quanto ao andamento do seu processo. Tendo alguma dúvida, pode estar me sinalizando.' },
  { id: 'golpe-1', cat: 'Golpe', title: 'Alerta de Golpe (Padrão)', text: 'Peço que desconsidere quaisquer informações repassadas por essa pessoa, ela não faz parte do nosso escritório. Como o processo não tramita em segredo de justiça, qualquer pessoa que possua um token de advogado consegue ter acesso às informações anexadas no processo. Solicitamos que, por gentileza, concentre o contato exclusivamente com o grupo do Setor Jurídico ou diretamente conosco, do Setor Processual.' },
  { id: 'audiencia-1', cat: 'Audiência', title: 'Informativo Audiência', text: 'Referente ao seu procedimento, verificamos que foi agendada uma audiência para tentativa de conciliação entre as partes. Essa audiência irá ocorrer no dia [DATA] às [HORA], na modalidade: [MODALIDADE]. O link de acesso será enviado em um prazo de 24 a 72 horas antes do evento.' },
  { id: 'procedimento-1', cat: 'Procedimento', title: 'Extrajudicial para Judicial', text: 'Inicialmente realizamos um procedimento extrajudicial que possui um prazo de 30 a 90 dias. Como a financeira dificultou a tratativa amigável, o advogado verificou que poderíamos seguir tratando judicialmente perante ao juiz, demonstrando a tentativa amigável anterior.' },
  { id: 'custas-1', cat: 'Custas', title: 'Justiça Gratuita Indeferida', text: 'Referente ao seu processo, o juiz indeferiu o pedido de Justiça Gratuita após a análise dos documentos apresentados. Dessa forma, para dar continuidade, será necessário efetuar o pagamento das custas processuais que correspondem às despesas do Poder Judiciário.' },
];

export default function WhatsAppHub() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [courtHistory, setCourtHistory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [scriptSearch, setScriptSearch] = useState('');
  const [preferredModel, setPreferredModel] = useState<string>('xai');
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia') || 'xai';
    setPreferredModel(savedIA);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) setCases(repoData);
    } catch (e) {
      console.error('[Gabinete] WhatsApp Sync Error');
    } finally {
      setLoading(false);
    }
  };

  const contacts = useMemo(() => {
    const uniqueContacts = new Map();
    cases.forEach(c => {
      if (c.telefone && c.telefone.trim() !== '' && !uniqueContacts.has(c.cliente)) {
        uniqueContacts.set(c.cliente, { ...c, nome: c.cliente, telefone: c.telefone });
      }
    });
    return Array.from(uniqueContacts.values())
      .filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cases, search]);

  const filteredScripts = useMemo(() => {
    return SCRIPTS_GABINETE.filter(s => 
      s.title.toLowerCase().includes(scriptSearch.toLowerCase()) || 
      s.cat.toLowerCase().includes(scriptSearch.toLowerCase()) ||
      s.text.toLowerCase().includes(scriptSearch.toLowerCase())
    );
  }, [scriptSearch]);

  const processTextVariables = (text: string) => {
    if (!selectedContact) return text;
    return text
      .replace(/\[NOME\]/g, selectedContact.nome)
      .replace(/\[PROTOCOLO\]/g, selectedContact.protocolo)
      .replace(/\[DATA\]/g, "---")
      .replace(/\[HORA\]/g, "---")
      .replace(/\[USUARIO\]/g, profile?.nome || "Setor Processual");
  };

  const handleApplyScript = (scriptText: string) => {
    setAiResponse(processTextVariables(scriptText));
    toast({ title: "Modelo Aplicado" });
  };

  const handleGenerateAI = async (agent: 'legal' | 'comercial' | 'financeiro') => {
    if (!selectedContact || isGenerating) return;
    setIsGenerating(true);
    setAiResponse('');

    const contextNotes = selectedContact.observacao || "Sem observações registradas.";
    const userSignature = profile?.nome || "Setor Processual";

    const systemContext = `Você é o Setor Processual da Get Assessoria.
    CLIENTE: ${selectedContact.nome} | PROTOCOLO: ${selectedContact.protocolo} | STATUS: ${selectedContact.status}
    OBSERVAÇÕES: ${contextNotes} | ASSINATURA: ${userSignature}`;

    const prompts = {
      legal: `Redija uma atualização jurídica sobre o status '${selectedContact.status}'. Use o estilo do script 'procedimento-1'.`,
      comercial: `Redija uma mensagem cordial. Use o estilo do script 'apresentacao-2'.`,
      financeiro: `Redija uma mensagem sobre custas judiciais. Use o estilo do script 'custas-1'.`
    };

    const fallbackScripts = {
      legal: SCRIPTS_GABINETE.find(s => s.id === 'procedimento-1')?.text || '',
      comercial: SCRIPTS_GABINETE.find(s => s.id === 'apresentacao-2')?.text || '',
      financeiro: SCRIPTS_GABINETE.find(s => s.id === 'custas-1')?.text || ''
    };

    try {
      const res = await perguntarIA({
        pergunta: `${systemContext}\n\nTarefa: ${prompts[agent]}`,
        preferredModel,
        historico: []
      });

      if (res && res.resposta && !res.fallback) {
        setAiResponse(res.resposta);
      } else {
        setAiResponse(processTextVariables(fallbackScripts[agent]));
        toast({ title: "Fallback Ativado", description: "Usando script padrão por indisponibilidade neural." });
      }
    } catch (error) {
      setAiResponse(processTextVariables(fallbackScripts[agent]));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDataJudAudit = async () => {
    if (!selectedContact || isAuditing) return;
    const protocol = selectedContact.protocolo || "";
    if (protocol.replace(/\D/g, '').length !== 20) {
      toast({ title: "Protocolo Inválido", description: "O CNJ do cliente não possui 20 dígitos.", variant: "destructive" });
      return;
    }

    setIsAuditing(true);
    setAiResponse('');
    
    try {
      const result = await executarVereditoAI({ cnj: protocol, preferredModel });
      if (result && result.success) {
        setAiResponse(result.mensagemCliente || result.resumoTecnico);
        toast({ title: "Auditoria 3D Concluída", description: "Dados capturados do DataJud." });
      } else {
        toast({ title: "Falha na Auditoria", description: "Processo não localizado ou motor offline.", variant: "destructive" });
        // Fallback para script de análise inicial
        handleGenerateAI('legal');
      }
    } catch (error) {
      toast({ title: "Erro de Conexão", description: "Falha ao atingir o motor DataJud.", variant: "destructive" });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleGenerateFromHistory = async () => {
    if (!selectedContact || !courtHistory.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiResponse('');

    const prompt = `Analise este histórico de tribunal: ${courtHistory.substring(0, 8000)}
    CLIENTE: ${selectedContact.nome} | ASSINATURA: ${profile?.nome || "Setor Processual"}
    TAREFA: Gere uma mensagem curta para o WhatsApp explicando o que aconteceu por último e os próximos passos.`;

    try {
      const res = await perguntarIA({ pergunta: prompt, preferredModel, historico: [] });
      if (res && res.resposta && !res.fallback) {
        setAiResponse(res.resposta);
      } else {
        const fallbackText = `Olá ${selectedContact.nome}, verificamos uma nova movimentação no seu processo. Estamos analisando os detalhes técnicos e em breve traremos mais informações sobre os próximos passos. Atenciosamente, ${profile?.nome || "Setor Processual"}.`;
        setAiResponse(fallbackText);
        toast({ title: "Análise Padrão", description: "IA ocupada. Gerado resumo de segurança." });
      }
    } catch (error) {
      setAiResponse(`Olá ${selectedContact.nome}, nova atualização identificada. Entraremos em contato com detalhes técnicos.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendAPI = async () => {
    if (!selectedContact || !aiResponse || isSending) return;
    setIsSending(true);
    try {
      const result = await sendWhatsAppAction(selectedContact.telefone, aiResponse);
      if (result.success) toast({ title: "Mensagem Entregue" });
      else toast({ title: "Falha na Entrega", description: result.message, variant: "destructive" });
    } catch (e) {
      toast({ title: "Erro de Conexão", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado" });
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper scale-75 lg:scale-100">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <MessageCircle size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-sm lg:text-xl text-black uppercase tracking-tighter">Terminal WhatsApp Elite</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-2">
               <span className="text-[8px] font-black uppercase text-black/40 mb-0.5">Cascata Neural Ativa</span>
               <Select value={preferredModel} onValueChange={(val) => { setPreferredModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                <SelectTrigger className="w-[180px] border-2 border-black font-black uppercase text-[10px] h-9 rounded-none bg-white">
                  <SelectValue placeholder="Motor Neural" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-black rounded-none">
                  <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 4.5</SelectItem>
                  <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3</SelectItem>
                  <SelectItem value="groq-deepseek" className="font-black uppercase text-[10px]">Groq DeepSeek R1</SelectItem>
                  <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-black font-black border-black border-2 px-3 py-1 uppercase text-[10px] h-9 items-center">
              <Zap size={10} className="mr-1.5 text-yellow-500 fill-yellow-500" /> Evolution Active
            </Badge>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <aside className={cn(
            "w-full lg:w-80 border-r-2 border-black bg-white flex flex-col shrink-0 overflow-hidden",
            selectedContact ? "hidden lg:flex" : "flex"
          )}>
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input placeholder="FILTRAR AGENDA..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 border-black border-2 h-10 text-[10px] font-black uppercase rounded-none" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y-2 divide-black/5">
                {contacts.map((contact) => (
                  <button key={contact.id} onClick={() => { setSelectedContact(contact); setAiResponse(''); }} className={cn("w-full p-4 flex items-center gap-3 hover:bg-black group transition-all text-left border-l-4", selectedContact?.id === contact.id ? "bg-black border-l-black" : "bg-white border-l-transparent")}>
                    <div className={cn("w-10 h-10 border-2 border-black flex items-center justify-center shrink-0", selectedContact?.id === contact.id ? "bg-white" : "bg-[#f3f2f2]")}><User size={20} className="text-black" /></div>
                    <div className="min-w-0">
                      <p className={cn("text-[11px] font-black uppercase truncate", selectedContact?.id === contact.id ? "text-white" : "text-black")}>{contact.nome}</p>
                      <p className={cn("text-[9px] font-mono", selectedContact?.id === contact.id ? "text-white/60" : "text-black/40")}>{contact.telefone}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <section className={cn("flex-1 bg-[#f3f2f2] flex flex-col overflow-hidden", !selectedContact ? "hidden lg:flex" : "flex")}>
             {selectedContact ? (
               <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
                    <Button variant="ghost" onClick={() => setSelectedContact(null)} className="lg:hidden mb-4 self-start text-black font-black uppercase text-[10px]"><ChevronLeft size={16} /> Voltar</Button>

                    <Card className="flex-1 border-2 border-black rounded-none shadow-[8px_8px_0px_#000] flex flex-col overflow-hidden bg-white">
                       <CardHeader className="bg-black text-white py-3 px-6 flex flex-row items-center justify-between shrink-0">
                          <CardTitle className="text-[10px] font-black uppercase tracking-widest">Painel de Atendimento Elite</CardTitle>
                          <Dialog>
                            <DialogTrigger asChild>
                               <Button variant="outline" size="sm" className="h-8 border-white/20 text-white bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase rounded-none"><BookOpen size={12} className="mr-2" /> Modelos Oficiais</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh] flex flex-col rounded-none border-2 border-black bg-white p-0">
                               <DialogHeader className="p-6 bg-black text-white border-b-2 border-black">
                                 <DialogTitle className="font-black uppercase tracking-widest flex items-center gap-2"><BookOpen size={18}/> Repositório Get Assessoria</DialogTitle>
                               </DialogHeader>
                               <div className="p-4 border-b-2 border-black bg-gray-100"><Input placeholder="BUSCAR SCRIPT..." value={scriptSearch} onChange={(e) => setScriptSearch(e.target.value)} className="border-black border-2 font-black uppercase text-[11px] rounded-none" /></div>
                               <ScrollArea className="flex-1 p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {filteredScripts.map((s) => (
                                       <div key={s.id} className="p-4 border-2 border-black hover:bg-black group transition-all">
                                          <Badge className="bg-black text-white group-hover:bg-white group-hover:text-black text-[8px] font-black uppercase rounded-none mb-2">{s.cat}</Badge>
                                          <h4 className="font-black uppercase text-[10px] mb-2 group-hover:text-white">{s.title}</h4>
                                          <p className="text-[9px] font-bold text-black/60 group-hover:text-white/60 leading-relaxed uppercase">{s.text.substring(0, 100)}...</p>
                                          <Button onClick={() => handleApplyScript(s.text)} className="w-full mt-4 h-8 bg-white text-black border-2 border-black font-black uppercase text-[8px] rounded-none group-hover:bg-primary group-hover:text-black">Aplicar Script</Button>
                                       </div>
                                     ))}
                                  </div>
                               </ScrollArea>
                            </DialogContent>
                          </Dialog>
                       </CardHeader>
                       
                       <CardContent className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 min-h-0">
                          <Tabs defaultValue="ia" className="flex-1 flex flex-col min-h-0">
                            <TabsList className="bg-gray-100 border-2 border-black rounded-none p-1 h-12">
                              <TabsTrigger value="ia" className="flex-1 font-black uppercase text-[9px] data-[state=active]:bg-black data-[state=active]:text-white">IA Estratégica</TabsTrigger>
                              <TabsTrigger value="history" className="flex-1 font-black uppercase text-[9px] data-[state=active]:bg-black data-[state=active]:text-white">Análise Tribunal</TabsTrigger>
                            </TabsList>

                            <TabsContent value="ia" className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Button variant="outline" onClick={() => handleGenerateAI('legal')} disabled={isGenerating || isAuditing} className="h-10 border-2 border-black font-black uppercase text-[9px] hover:bg-black hover:text-white bg-white">Jurídico</Button>
                                <Button variant="outline" onClick={() => handleGenerateAI('financeiro')} disabled={isGenerating || isAuditing} className="h-10 border-2 border-black font-black uppercase text-[9px] hover:bg-black hover:text-white bg-white">Financeiro</Button>
                                <Button variant="outline" onClick={() => handleGenerateAI('comercial')} disabled={isGenerating || isAuditing} className="h-10 border-2 border-black font-black uppercase text-[9px] hover:bg-black hover:text-white bg-white">Comercial</Button>
                                <Button variant="outline" onClick={handleDataJudAudit} disabled={isGenerating || isAuditing} className="h-10 border-2 border-black font-black uppercase text-[9px] bg-primary text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_#000]">
                                   {isAuditing ? <Loader2 size={12} className="animate-spin mr-1" /> : <FileSearch size={12} className="mr-1" />} 3D Audit
                                </Button>
                              </div>
                              <div className="flex-1 bg-[#f8f9fb] border-2 border-dashed border-black/20 p-4 flex flex-col relative min-h-0">
                                {(isGenerating || isAuditing) && (
                                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-center px-6">
                                    <Loader2 className="animate-spin text-black mb-2" size={32} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">{isAuditing ? "Consultando DataJud & Triagem Neural..." : "Sincronizando Resiliência Neural..."}</p>
                                  </div>
                                )}
                                <textarea 
                                  value={aiResponse} 
                                  onChange={(e) => setAiResponse(e.target.value)} 
                                  placeholder="REDIJA SUA MENSAGEM OU USE A IA ACIMA..." 
                                  className="w-full h-full bg-transparent border-none resize-none text-[11px] lg:text-sm font-black uppercase leading-relaxed text-black focus:ring-0" 
                                />
                              </div>
                            </TabsContent>

                            <TabsContent value="history" className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
                               <Textarea placeholder="COLE O HISTÓRICO DO TRIBUNAL AQUI..." value={courtHistory} onChange={(e) => setCourtHistory(e.target.value)} className="min-h-[120px] border-2 border-black rounded-none font-black uppercase text-[10px]" />
                               <Button onClick={handleGenerateFromHistory} disabled={!courtHistory.trim() || isGenerating} className="w-full bg-black text-white border-2 border-black font-black uppercase h-12 rounded-none">
                                  {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit size={16} className="mr-2" />} Analisar & Gerar Despacho
                               </Button>
                            </TabsContent>
                          </Tabs>

                          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-black/5">
                             <Button disabled={!aiResponse || isSending} onClick={handleSendAPI} className="flex-1 h-12 bg-black text-white border-2 border-black font-black uppercase text-[10px] hover:bg-white hover:text-black rounded-none shadow-[4px_4px_0px_#000] hover:shadow-none">
                                {isSending ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />} Enviar Evolution API
                             </Button>
                             <Button asChild variant="outline" className="flex-1 h-12 border-2 border-black font-black uppercase text-[10px] hover:bg-black hover:text-white rounded-none bg-white">
                                <a href={formatWhatsAppLink(selectedContact.telefone, aiResponse)} target="_blank" rel="noopener noreferrer">
                                   <MessageCircle size={16} className="mr-2" /> WhatsApp Manual
                                </a>
                              </Button>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <Bot size={64} className="mb-6" />
                  <h2 className="text-xl font-black uppercase">Selecione um Cliente para Atendimento</h2>
               </div>
             )}
          </section>

          {selectedContact && (
            <aside className="hidden xl:flex w-96 border-l-2 border-black bg-white flex flex-col shrink-0">
               <div className="p-6 bg-[#f8f9fb] border-b-2 border-black">
                 <h2 className="text-lg font-black uppercase truncate">{selectedContact.nome}</h2>
                 <p className="text-[10px] font-black uppercase text-black/40">Gabinete de Atendimento</p>
               </div>
               <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                     <section className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Contexto Processual</Label>
                        <div className="grid gap-2">
                           <div className="flex items-center gap-3 p-2 bg-[#f3f2f2] border border-black/5">
                             <FileText size={12} className="shrink-0" />
                             <p className="text-[10px] font-black uppercase truncate">{selectedContact.protocolo}</p>
                           </div>
                           <div className="flex items-center gap-3 p-2 bg-[#f3f2f2] border border-black/5">
                             <Clock size={12} className="shrink-0" />
                             <p className="text-[10px] font-black uppercase">{selectedContact.status}</p>
                           </div>
                        </div>
                     </section>
                     <section className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Notas Estratégicas</Label>
                        <div className="p-4 bg-[#f3f2f2] border-2 border-black rounded-none">
                          <p className="text-[10px] font-black uppercase leading-relaxed text-black/60 italic">
                            {selectedContact.observacao || 'SEM NOTAS REGISTRADAS.'}
                          </p>
                        </div>
                     </section>
                  </div>
               </ScrollArea>
            </aside>
          )}
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
        </footer>
      </main>
    </div>
  );
}
