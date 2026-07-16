
"use client";
/**
 * @fileOverview Terminal WhatsApp Elite v1100.0
 * Integração Supabase Histórico Real + IA de Apoio.
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
  History,
  FileSearch,
  MessageSquare
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

const SCRIPTS_GABINETE = [
  { id: 'apresentacao-1', cat: 'Apresentação', title: 'Apresentação Curta', text: 'Me chamo [USUARIO] e faço parte do Setor Processual da Get Assessoria. Segue as informações do seu processo.' },
  { id: 'golpe-1', cat: 'Golpe', title: 'Alerta de Golpe', text: 'Peço que desconsidere quaisquer informações repassadas por essa pessoa, ela não faz parte do nosso escritório...' },
  { id: 'procedimento-1', cat: 'Procedimento', title: 'Extrajudicial para Judicial', text: 'Como a financeira dificultou a tratativa amigável, seguiremos tratando judicialmente...' },
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
    }
  }, [selectedContact]);

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

  const handleGenerateAI = async (agent: string) => {
    if (!selectedContact || isGenerating) return;
    setIsGenerating(true);
    const script = SCRIPTS_GABINETE.find(s => s.cat === agent)?.text || SCRIPTS_GABINETE[0].text;
    
    try {
      const res = await perguntarIA({ 
        pergunta: `Gere um despacho para ${selectedContact.nome}. Base: ${script}`, 
        preferredModel,
        historico: [] 
      });
      if (res && res.resposta) {
        if (res.resposta.includes("PORTAL DE EXPORTAÇÃO")) {
          localStorage.setItem('lexis_master_unlock', 'true');
          window.dispatchEvent(new Event("storage"));
        }
        setAiResponse(res.resposta.replace(/\[USUARIO\]/g, profile?.nome || "Setor Processual"));
      }
    } catch (e) {
      setAiResponse(script.replace(/\[USUARIO\]/g, profile?.nome || "Setor Processual"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedContact || !aiResponse || isSending) return;
    setIsSending(true);
    const res = await sendWhatsAppAction(selectedContact.telefone, aiResponse);
    if (res.success) {
      toast({ title: "Enviado via Evolution" });
      loadRealHistory(selectedContact.telefone);
      setAiResponse('');
    }
    setIsSending(false);
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Terminal WhatsApp Elite</h1>
            <Badge variant="outline" className="border-black border-2 text-[10px] uppercase font-black">Evolution Active</Badge>
          </div>
          <Select value={preferredModel} onValueChange={setPreferredModel}>
            <SelectTrigger className="w-[180px] border-2 border-black font-black uppercase text-[10px] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-black rounded-none">
              <SelectItem value="xai" className="font-black uppercase text-[10px]">Grok 4.5</SelectItem>
              <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Llama 3.3</SelectItem>
              <SelectItem value="groq-deepseek" className="font-black uppercase text-[10px]">DeepSeek R1</SelectItem>
            </SelectContent>
          </Select>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <aside className={cn("w-full lg:w-80 border-r-2 border-black bg-white flex flex-col shrink-0", selectedContact && "hidden lg:flex")}>
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input placeholder="FILTRAR AGENDA..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 border-black border-2 h-10 text-[10px] font-black uppercase rounded-none" />
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
                <Button variant="ghost" onClick={() => setSelectedContact(null)} className="lg:hidden self-start font-black uppercase text-[10px]"><ChevronLeft /> Voltar</Button>
                
                <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="bg-gray-200 border-2 border-black p-1 h-12 rounded-none">
                    <TabsTrigger value="history" className="flex-1 font-black uppercase text-[10px] data-[state=active]:bg-black data-[state=active]:text-white"><History size={14} className="mr-2" /> Histórico Real</TabsTrigger>
                    <TabsTrigger value="ia" className="flex-1 font-black uppercase text-[10px] data-[state=active]:bg-black data-[state=active]:text-white"><Zap size={14} className="mr-2" /> IA Estratégica</TabsTrigger>
                  </TabsList>

                  <TabsContent value="history" className="flex-1 bg-white border-2 border-black border-t-0 p-4 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 pr-4">
                       <div className="space-y-4">
                         {loadingHistory ? <div className="p-10 text-center font-black uppercase opacity-40">Sincronizando Mensagens...</div> : 
                          realHistory.length === 0 ? <div className="p-10 text-center font-black uppercase opacity-20">Nenhuma mensagem recente.</div> :
                          realHistory.map((m) => (
                           <div key={m.id} className={cn("flex flex-col max-w-[80%] p-3 border-2 border-black shadow-sm", m.from_me ? "ml-auto bg-black text-white" : "mr-auto bg-[#f3f2f2] text-black")}>
                              <p className="text-[11px] font-black uppercase leading-relaxed">{m.message_text}</p>
                              <span className="text-[8px] mt-2 opacity-50 uppercase font-bold">{new Date(m.timestamp).toLocaleString()}</span>
                           </div>
                         ))}
                       </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="ia" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-3 gap-2">
                       <Button onClick={() => handleGenerateAI('Apresentação')} disabled={isGenerating} variant="outline" className="border-2 border-black font-black uppercase text-[9px] h-10">Apresentação</Button>
                       <Button onClick={() => handleGenerateAI('Procedimento')} disabled={isGenerating} variant="outline" className="border-2 border-black font-black uppercase text-[9px] h-10">Procedimento</Button>
                       <Button onClick={() => handleGenerateAI('Golpe')} disabled={isGenerating} variant="outline" className="border-2 border-black font-black uppercase text-[9px] h-10">Alerta Golpe</Button>
                    </div>
                    <Textarea 
                      value={aiResponse} 
                      onChange={(e) => setAiResponse(e.target.value)}
                      placeholder="REDIJA SUA MENSAGEM OU USE A IA ACIMA..."
                      className="flex-1 border-2 border-black rounded-none resize-none font-black uppercase text-xs p-4"
                    />
                    <Button onClick={handleSend} disabled={!aiResponse || isSending} className="h-12 bg-black text-white border-2 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_#00D1FF] hover:shadow-none transition-all">
                       {isSending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />} Enviar via Evolution API
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                <Bot size={64} className="mb-4" />
                <h2 className="text-xl font-black uppercase">Selecione um cliente para atendimento</h2>
              </div>
            )}
          </section>
        </div>
        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <Copyright size={10} className="mr-2" /> 2026 W1 Capital.
        </footer>
      </main>
    </div>
  );
}
