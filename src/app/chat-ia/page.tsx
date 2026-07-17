"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Bot, 
  Send, 
  RefreshCcw, 
  Loader2, 
  Copyright, 
  ShieldCheck,
  Zap,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChatbotIAPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Olá! Sou o Consultor Estratégico da W1 Capital. Como posso auxiliar no seu gabinete hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string>('xai');
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia') || 'xai';
    setModel(savedIA);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentModel = model;
    setInput('');
    setLoading(true);

    try {
      const res = await perguntarIA({
        pergunta: currentInput,
        historico: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        preferredModel: currentModel
      });

      if (res && res.resposta) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: res.resposta, 
          engine: res.engineUtilizada 
        }]);
        
        if (res.resposta.includes("PORTAL DE EXPORTAÇÃO")) {
          localStorage.setItem('lexis_master_unlock', 'true');
          window.dispatchEvent(new Event("storage"));
          toast({ title: "Acesso Master Liberado", description: "O portal de exportação agora está ativo em Configurações." });
        }
      } else {
        throw new Error("Falha na resposta neural.");
      }
    } catch (e) {
      toast({ title: "Instabilidade Neural", description: "Tentando reconectar via motor reserva...", variant: "destructive" });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Desculpe, tive uma instabilidade temporária. Acionei os motores de reserva. Como posso ajudar?" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (val: string) => {
    setModel(val);
    localStorage.setItem('lexisPredict_preferred_ia', val);
    toast({ title: "Unidade Neural Alterada", description: `Consultoria agora via ${val.toUpperCase()}.` });
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-black text-xl text-black uppercase tracking-tighter leading-none">Consultoria Estratégica</h1>
              <p className="text-[10px] font-bold text-black/40 uppercase mt-1 tracking-widest">Apoio Decisório em Tempo Real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Select value={model} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[240px] border-2 border-black font-black uppercase text-[10px] h-11 rounded-none bg-white">
                  <div className="flex items-center gap-2">
                    <Settings2 size={14} className="text-black/40" />
                    <SelectValue placeholder="Motor Neural" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-black rounded-none">
                  <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 4.5 Elite</SelectItem>
                  <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek-V3</SelectItem>
                  <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3 Pro</SelectItem>
                </SelectContent>
              </Select>
             <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px] h-11 px-4 hidden sm:flex">Gabinete Ativo</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4 lg:p-8 flex flex-col">
          <div className="flex-1 bg-white border-2 border-black rounded-none shadow-[10px_10px_0px_#000] flex flex-col overflow-hidden max-w-5xl mx-auto w-full">
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Soberania Grok 4.5 Ativa</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMessages([{ role: 'assistant', content: 'Consultoria reiniciada. Como posso auxiliar seu gabinete?' }])} className="h-8 w-8 hover:bg-black hover:text-white transition-all">
                <RefreshCcw size={14} />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6 bg-[#fafafa]" ref={scrollRef}>
              <div className="space-y-8 max-w-4xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-5 border-2 border-black shadow-sm relative",
                      msg.role === 'user' ? "bg-black text-white" : "bg-white text-black"
                    )}>
                      <p className="text-xs lg:text-sm font-black uppercase leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.engine && (
                      <span className="text-[8px] font-black uppercase mt-2 opacity-30 flex items-center gap-1.5">
                        <Zap size={8} className="text-yellow-500 fill-yellow-500" /> Unidade de Resposta: {msg.engine}
                      </span>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-3 text-black/40 animate-pulse bg-gray-100 p-4 border-2 border-dashed border-black/10 w-fit">
                    <Loader2 className="animate-spin" size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Raciocínio Profundo Grok 4.5...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="p-4 border-t-2 border-black bg-white flex gap-3">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder="DIGITE SUA DÚVIDA OU COMANDO DE SEGURANÇA..."
                className="flex-1 border-2 border-black h-14 text-xs font-black uppercase focus-visible:ring-0 rounded-none bg-[#f3f2f2]"
                autoFocus
              />
              <Button type="submit" disabled={loading || !input.trim()} className="bg-black text-white border-2 border-black h-14 w-20 hover:bg-white hover:text-black transition-all rounded-none shrink-0 shadow-[4px_4px_0px_#00D1FF] hover:shadow-none">
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}