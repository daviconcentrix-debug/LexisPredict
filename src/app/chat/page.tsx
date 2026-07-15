
"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MessageSquare, Send, Bot, RefreshCcw, Copyright } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChatPage() {
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [model, setModel] = useState<string>('xai');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
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

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const inputClean = chatInput.trim();

    // PROTOCOLO DE DESBLOQUEIO MASTER (Resiliente)
    if (inputClean.toUpperCase() === 'ASHDOPNEU') {
      localStorage.setItem('lexis_master_unlock', 'true');
      setChatMessages(prev => [...prev, 
        { role: 'user', content: chatInput },
        { role: 'assistant', content: "PROTOCOLO MASTER AUTORIZADO. ACESSO AO PORTAL DE EXPORTAÇÃO DE INFRAESTRUTURA LIBERADO EM CONFIGURAÇÕES." }
      ]);
      setChatInput('');
      toast({ title: "Portal Master Liberado", description: "Verifique a aba de Exportação em Configurações." });
      // Dispara evento para atualizar outras abas se necessário
      window.dispatchEvent(new Event('storage'));
      return;
    }

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await perguntarIA({ 
        pergunta: chatInput, 
        historico: chatMessages.slice(-10),
        preferredModel: model
      });

      if (isMounted.current) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.resposta }]);
      }
    } catch (error: any) {
      if (isMounted.current) {
        toast({ title: "Falha na Resposta", description: error.message, variant: "destructive" });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    toast({ title: "Histórico Limpo" });
  };

  return (
    <div className="flex h-screen bg-transparent font-sans text-foreground overflow-hidden relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden glass-panel">
        <header className="h-16 bg-background/40 backdrop-blur-xl border-b border-border px-6 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm bg-primary flex items-center justify-center">
                <MessageSquare size={20} className="text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-lg font-black text-foreground uppercase tracking-tight hover:bg-foreground hover:text-background px-2 py-1 transition-all rounded-sm cursor-default">Consultoria Corporativa</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={(val) => { setModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
              <SelectTrigger className="w-[180px] border-2 border-border font-black uppercase text-[10px] h-10 rounded-none bg-background/50">
                <SelectValue placeholder="Motor Neural" />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 border-border rounded-none">
                <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 4.5</SelectItem>
                <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek</SelectItem>
                <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3</SelectItem>
                <SelectItem value="groq-deepseek" className="font-black uppercase text-[10px]">Groq DeepSeek R1</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={clearChat} className="border-border border-2 h-10 text-[10px] font-black uppercase hover:bg-foreground hover:text-background transition-all rounded-none bg-background/50">
              <RefreshCcw size={12} className="mr-2" /> Reiniciar
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6">
          <Card className="max-w-4xl mx-auto bg-background/40 backdrop-blur-xl border-border shadow-2xl h-full flex flex-col rounded-sm overflow-hidden border-2">
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6">
                {chatMessages.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <div className="icon-3d-wrapper w-fit mx-auto">
                      <div className="icon-3d-block black w-16 h-16 rounded-sm bg-primary flex items-center justify-center">
                        <Bot className="text-primary-foreground" size={32} />
                      </div>
                    </div>
                    <h2 className="text-xl font-black text-foreground uppercase">Como posso auxiliar hoje?</h2>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex group animate-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "p-4 rounded-none max-w-[85%] shadow-sm text-sm font-black uppercase transition-all border-2",
                      msg.role === 'user' ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border text-foreground"
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t-2 border-border bg-background/60 shrink-0">
              <form onSubmit={handleChat} className="flex gap-3">
                <Input placeholder="INSIRA SUA DÚVIDA TÉCNICA OU COMANDO..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={loading} className="flex-1 border-2 border-border h-12 text-sm font-black text-foreground uppercase rounded-none bg-background/50 focus-visible:ring-primary" />
                <Button type="submit" size="icon" disabled={loading} className="h-12 w-12 bg-primary text-primary-foreground border-2 border-primary rounded-none hover:opacity-90">
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </Card>
        </div>
        <footer className="h-10 border-t border-border bg-background/40 flex items-center justify-center gap-6 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
        </footer>
      </main>
    </div>
  );
}
