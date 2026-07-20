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
  Settings2,
  Clock
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
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string>('xai');
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia') || 'xai';
    setModel(savedIA);
    setMessages([{ 
      role: 'assistant', 
      content: 'Olá! Sou o Consultor Estratégico da W1 Capital. Minha rede neural de resiliência v250 está ativa. Como posso auxiliar no seu gabinete hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { 
      role: 'user', 
      content: input, 
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
    };
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

      if (res && res.sucesso) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: res.resposta, 
          engine: res.engineUtilizada,
          latency: res.latencia,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]);
        
        if (res.resposta.includes("PORTAL DE EXPORTAÇÃO")) {
          localStorage.setItem('lexis_master_unlock', 'true');
          window.dispatchEvent(new Event("storage"));
          toast({ title: "Acesso Master Liberado" });
        }
      } else {
        throw new Error("Falha Crítica");
      }
    } catch (e) {
      toast({ title: "Instabilidade Neural", variant: "destructive" });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Identificamos uma oscilação na rede neural estratégica. Nossos motores estão em modo de recuperação manual.",
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl shadow-lg">
              <Bot size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="font-black text-xl uppercase tracking-tighter leading-none">Consultoria Neural</h1>
              <p className="text-[10px] font-bold text-black/40 uppercase mt-1.5 tracking-widest">Resiliência de Elite v250.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Select value={model} onValueChange={(val) => { setModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                <SelectTrigger className="w-[220px] border-2 border-black font-black uppercase text-[10px] h-11 rounded-none bg-white">
                  <div className="flex items-center gap-2">
                    <Settings2 size={14} className="text-black/40" />
                    <SelectValue placeholder="Motor Principal" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-black rounded-none">
                  <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 4.5 Elite</SelectItem>
                  <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3 Pro</SelectItem>
                  <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek</SelectItem>
                </SelectContent>
              </Select>
             <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px] h-11 px-4 hidden sm:flex">Núcleo Ativo</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6 lg:p-10 flex flex-col">
          <div className="flex-1 bg-white border-2 border-black rounded-none shadow-[10px_10px_0px_#000] flex flex-col overflow-hidden max-w-6xl mx-auto w-full relative">
            <ScrollArea className="flex-1 p-8 bg-[#fafafa]" ref={scrollRef}>
              <div className="space-y-12 max-w-4xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-6 border-2 border-black shadow-sm relative group",
                      msg.role === 'user' ? "bg-black text-white" : "bg-white text-black"
                    )}>
                      <p className="text-sm font-black uppercase leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <span className={cn(
                        "text-[8px] font-black absolute bottom-2 right-3 opacity-30",
                        msg.role === 'user' ? "text-white" : "text-black"
                      )}>{msg.timestamp}</span>
                    </div>
                    {msg.engine && (
                      <div className="mt-2 flex items-center gap-4 opacity-40">
                         <span className="text-[8px] font-black uppercase flex items-center gap-1.5">
                           <Zap size={8} className="text-yellow-500 fill-yellow-500" /> Motor: {msg.engine}
                         </span>
                         <span className="text-[8px] font-black uppercase flex items-center gap-1.5">
                           <Clock size={8}/> Latência: {(msg.latency / 1000).toFixed(1)}s
                         </span>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-4 text-black/40 animate-pulse bg-gray-100 p-5 border-2 border-dashed border-black/10 w-fit">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Processamento Neural de Resiliência...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="p-6 border-t-2 border-black bg-white flex gap-4">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder="DIGITE SUA DÚVIDA ESTRATÉGICA..."
                className="flex-1 border-2 border-black h-16 text-xs font-black uppercase focus-visible:ring-0 rounded-none bg-[#f3f2f2]"
                autoFocus
              />
              <Button type="submit" disabled={loading || !input.trim()} className="bg-black text-white border-2 border-black h-16 w-24 hover:bg-white hover:text-black transition-all rounded-none shrink-0 shadow-[4px_4px_0px_#00D1FF] hover:shadow-none">
                <Send size={20} />
              </Button>
            </form>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital. Advanced Decision Support.</div>
        </footer>
      </main>
    </div>
  );
}
