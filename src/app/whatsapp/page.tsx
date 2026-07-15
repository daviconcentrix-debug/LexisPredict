
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  MessageCircle, 
  Search, 
  Send, 
  User, 
  ShieldCheck, 
  RefreshCcw,
  Zap,
  Loader2,
  Copyright,
  Bot,
  Scale,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchRepoCases } from '@/app/actions/case-actions';
import { sendYCloudWhatsApp } from '@/app/actions/whatsapp-actions';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

export default function WhatsAppHub() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) {
        setCases(repoData);
      }
    } catch (e) {
      console.error('WhatsApp Hub: Sync Fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const contacts = useMemo(() => {
    const uniqueContacts = new Map();
    cases.forEach(c => {
      if (c.telefone && c.telefone.trim() !== '') {
        if (!uniqueContacts.has(c.cliente)) {
          uniqueContacts.set(c.cliente, {
            ...c,
            nome: c.cliente,
            telefone: c.telefone,
          });
        }
      }
    });
    
    return Array.from(uniqueContacts.values())
      .filter(c => 
        c.nome.toLowerCase().includes(search.toLowerCase()) || 
        c.telefone.includes(search)
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cases, search]);

  const handleGenerateAI = async (agent: 'legal' | 'comercial' | 'financeiro') => {
    if (!selectedContact || isGenerating) return;
    
    setIsGenerating(true);
    setAiResponse(''); 

    const prompts = {
      legal: `Gere uma atualização jurídica profissional e humanizada para o cliente ${selectedContact.nome}. Processo: ${selectedContact.protocolo}. Tribunal: ${selectedContact.tribunal}. Status: ${selectedContact.status}. Última Observação: ${selectedContact.observacao || 'Nenhuma'}.`,
      comercial: `Gere uma mensagem de boas-vindas e acolhimento para o novo cliente ${selectedContact.nome}. Explique que o gabinete W1 Capital está cuidando de tudo e peça para ele confirmar se tem alguma dúvida inicial.`,
      financeiro: `Gere uma mensagem educada para o cliente ${selectedContact.nome} sobre o pagamento de custas processuais ou honorários pendentes, mantendo o tom de parceria e transparência.`
    };

    try {
      const preferredIA = localStorage.getItem('lexisPredict_preferred_ia') || 'xai';
      const res = await perguntarIA({
        pergunta: prompts[agent],
        preferredModel: preferredIA,
        historico: []
      });

      if (!res || res.error) {
        toast({ 
          title: "Erro na IA", 
          description: res?.resposta || "Os motores estão instáveis. Tente trocar o motor em Configurações.", 
          variant: "destructive" 
        });
      } else {
        setAiResponse(res.resposta || "");
        toast({ title: "Despacho Redigido" });
      }
    } catch (error: any) {
      toast({ title: "Erro na IA", description: error.message || "O servidor neural não respondeu a tempo.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendAPI = async () => {
    if (!selectedContact || !aiResponse || isSending) return;
    setIsSending(true);
    
    try {
      const result = await sendYCloudWhatsApp(selectedContact.telefone, aiResponse);
      if (result.success) {
        toast({ title: "Mensagem Enviada", description: "O despacho via API foi entregue com sucesso." });
      } else {
        toast({ title: "Falha API", description: result.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro de Rede", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 lg:h-16 border-b border-[#dddbda] bg-white/90 backdrop-blur-sm flex items-center justify-between px-6 lg:px-8 shrink-0 z-40">
          <div className="flex items-center gap-4 pl-10 lg:pl-0">
            <div className="icon-3d-wrapper scale-75 lg:scale-100">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <MessageCircle size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-sm lg:text-xl text-black uppercase tracking-tighter truncate max-w-[150px] lg:max-w-none">Terminal WhatsApp</h1>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={loadData} className="hidden sm:flex h-9 text-black font-black hover:bg-black hover:text-white border-2 border-black transition-all uppercase text-[10px] px-6 bg-white">
              <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} /> Sincronizar
            </Button>
            <Badge variant="outline" className="text-black font-black border-black border-2 px-2 lg:px-3 py-1 uppercase text-[8px] lg:text-[10px]">
              <Zap size={10} className="mr-1.5 text-yellow-500 fill-yellow-500" /> API Ativa
            </Badge>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <aside className={cn(
            "w-full lg:w-80 border-r-2 border-black bg-white flex flex-col shrink-0 overflow-hidden transition-all",
            selectedContact ? "hidden lg:flex" : "flex"
          )}>
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input 
                  placeholder="FILTRAR AGENDA..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-black border-2 h-10 text-[10px] font-black focus-visible:ring-0 text-black uppercase bg-white rounded-none"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y-2 divide-black/5">
                {contacts.length > 0 ? contacts.map((contact) => (
                  <button 
                    key={contact.id} 
                    onClick={() => { setSelectedContact(contact); setAiResponse(''); }}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-black group transition-all text-left border-l-4",
                      selectedContact?.id === contact.id ? "bg-black border-l-black" : "bg-white border-l-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 transition-colors",
                      selectedContact?.id === contact.id ? "bg-white" : "bg-[#f3f2f2]"
                    )}>
                      <User size={20} className="text-black" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-[11px] font-black uppercase truncate", selectedContact?.id === contact.id ? "text-white" : "text-black")}>{contact.nome}</p>
                      <p className={cn("text-[9px] font-mono", selectedContact?.id === contact.id ? "text-white/60" : "text-black/40")}>{contact.telefone}</p>
                    </div>
                    {selectedContact?.id === contact.id && <ChevronRight className="ml-auto text-white" size={14} />}
                  </button>
                )) : (
                  <div className="p-8 text-center opacity-40">
                    <p className="text-[10px] font-black uppercase italic">Nenhum contato localizado.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          <section className={cn(
            "flex-1 bg-[#f3f2f2] flex flex-col overflow-hidden relative",
            !selectedContact ? "hidden lg:flex" : "flex"
          )}>
             {selectedContact ? (
               <>
                 <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
                    <Button variant="ghost" onClick={() => setSelectedContact(null)} className="lg:hidden mb-4 self-start text-black font-black uppercase text-[10px]">
                      <ChevronLeft size={16} className="mr-1" /> Voltar para Agenda
                    </Button>

                    <Card className="flex-1 border-2 border-black rounded-none shadow-[8px_8px_0px_#000] flex flex-col overflow-hidden bg-white">
                       <CardHeader className="bg-black text-white py-3 px-6 flex flex-row items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                             <Sparkles size={16} className="text-yellow-400" />
                             <CardTitle className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Atendimento IA</CardTitle>
                          </div>
                          <Badge variant="outline" className="hidden sm:block border-white/20 text-white text-[8px] font-black uppercase">Agente Ativo</Badge>
                       </CardHeader>
                       
                       <CardContent className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 lg:space-y-6 min-h-0">
                          <div className="grid grid-cols-3 gap-2 lg:gap-3 shrink-0">
                             <Button 
                                variant="outline" 
                                onClick={() => handleGenerateAI('legal')} 
                                className="h-9 lg:h-10 border-2 border-black font-black uppercase text-[8px] lg:text-[9px] hover:bg-black hover:text-white transition-all rounded-none px-1"
                             >
                                <Scale size={12} className="mr-1 lg:mr-2" /> Jurídico
                             </Button>
                             <Button 
                                variant="outline" 
                                onClick={() => handleGenerateAI('comercial')} 
                                className="h-9 lg:h-10 border-2 border-black font-black uppercase text-[8px] lg:text-[9px] hover:bg-black hover:text-white transition-all rounded-none px-1"
                             >
                                <Sparkles size={12} className="mr-1 lg:mr-2" /> Comercial
                             </Button>
                             <Button 
                                variant="outline" 
                                onClick={() => handleGenerateAI('financeiro')} 
                                className="h-9 lg:h-10 border-2 border-black font-black uppercase text-[8px] lg:text-[9px] hover:bg-black hover:text-white transition-all rounded-none px-1"
                             >
                                <Zap size={12} className="mr-1 lg:mr-2" /> Financeiro
                             </Button>
                          </div>

                          <div className="flex-1 bg-[#f8f9fb] border-2 border-dashed border-black/20 p-4 flex flex-col relative min-h-0">
                             {isGenerating ? (
                               <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
                                  <Loader2 className="animate-spin text-black" size={32} />
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Redigindo...</p>
                               </div>
                             ) : null}
                             
                             <textarea 
                                value={aiResponse}
                                onChange={(e) => setAiResponse(e.target.value)}
                                placeholder="A IA IRÁ REDIGIR A RESPOSTA AQUI..."
                                className="w-full h-full bg-transparent border-none resize-none text-[11px] lg:text-sm font-black uppercase leading-relaxed text-black focus:ring-0 placeholder:text-black/10"
                             />
                          </div>

                          <div className="flex flex-col gap-3 lg:gap-4 shrink-0">
                             <div className="flex flex-col sm:flex-row gap-3">
                               <Button 
                                  disabled={!aiResponse || isSending}
                                  onClick={handleSendAPI}
                                  className="flex-1 h-12 bg-black text-white border-2 border-black font-black uppercase text-[10px] hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_#000] hover:shadow-none rounded-none"
                               >
                                  {isSending ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                  Enviar API
                               </Button>
                               <Button 
                                  asChild
                                  variant="outline"
                                  className="flex-1 h-12 border-2 border-black font-black uppercase text-[10px] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000] hover:shadow-none rounded-none bg-white"
                               >
                                  <a href={formatWhatsAppLink(selectedContact?.telefone || '', aiResponse)} target="_blank" rel="noopener noreferrer">
                                     <MessageCircle size={16} className="mr-2" /> Chat Pessoal
                                  </a>
                                </Button>
                             </div>
                             
                             <div className="hidden sm:flex bg-blue-50 border border-blue-200 p-3 gap-3 items-start">
                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-blue-900 uppercase">Aviso:</p>
                                  <p className="text-[8px] font-bold text-blue-700 uppercase leading-tight">
                                    O <b>Disparo API</b> usa chave YCloud Profissional. 
                                    Para <b>WhatsApp pessoal</b>, use <b>Chat Manual</b>.
                                  </p>
                                </div>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
               </>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 opacity-30">
                  <div className="icon-3d-wrapper">
                    <div className="icon-3d-block black w-20 h-20 lg:w-24 lg:h-24 rounded-none">
                      <Bot size={48} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-2xl font-black uppercase tracking-widest">Aguardando Seleção</h2>
                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] mt-2">Escolha um contato para iniciar.</p>
                  </div>
               </div>
             )}
          </section>

          {selectedContact && (
            <aside className="hidden xl:flex w-96 border-l-2 border-black bg-white flex flex-col shrink-0 overflow-hidden shadow-2xl">
               <div className="p-6 bg-[#f8f9fb] border-b-2 border-black">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-1">Dossiê de Atendimento</h3>
                  <h2 className="text-lg font-black uppercase leading-tight">{selectedContact.nome}</h2>
               </div>
               
               <ScrollArea className="flex-1 p-6">
                  <div className="space-y-8">
                     <section className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Contexto Procedural</Label>
                        <div className="space-y-3">
                           <InfoItem icon={<FileText size={12}/>} label="Protocolo CNJ" value={selectedContact.protocolo} />
                           <InfoItem icon={<Scale size={12}/>} label="Tribunal" value={selectedContact.tribunal} />
                           <InfoItem icon={<Clock size={12}/>} label="Status Atual" value={selectedContact.status} />
                           <InfoItem icon={<User size={12}/>} label="Responsável" value={selectedContact.advogado} />
                        </div>
                     </section>

                     <section className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Notas Estratégicas</Label>
                        <div className="p-4 bg-[#f3f2f2] border-2 border-black rounded-none">
                           <p className="text-[10px] font-black uppercase leading-relaxed text-black/60 italic">
                             {selectedContact.observacao || 'SEM NOTAS ADICIONAIS.'}
                           </p>
                        </div>
                     </section>
                  </div>
               </ScrollArea>

               <footer className="p-6 border-t-2 border-black bg-[#f8f9fb]">
                  <p className="text-[8px] font-black uppercase text-center text-black/40">
                    Sincronizado v160.0 Elite
                  </p>
               </footer>
            </aside>
          )}
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-4 lg:gap-6 text-[8px] lg:text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="hidden sm:inline uppercase font-black">Relatório Consolidado • DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
       <div className="w-7 h-7 bg-[#f3f2f2] border border-black flex items-center justify-center shrink-0">
          {icon}
       </div>
       <div className="min-w-0">
          <p className="text-[8px] font-black text-black/40 uppercase leading-none mb-0.5">{label}</p>
          <p className="text-[10px] font-black text-black uppercase truncate">{value}</p>
       </div>
    </div>
  );
}
