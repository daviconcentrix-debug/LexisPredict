"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MessageSquare, Send, Bot, User, Copyright, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="flex h-screen bg-background font-sans text-foreground relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-20">
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4 pl-10 lg:pl-0">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <MessageSquare size={20} className="text-white" />
              </div>
            </div>
            <h1 className="text-lg font-black text-foreground uppercase tracking-tight hover:bg-primary hover:text-primary-foreground px-2 py-1 transition-all rounded-sm cursor-default">Consultoria Get Assessoria</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={(val) => { setModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
              <SelectTrigger className="w-[180px] border-2 border-border font-black uppercase text-[10px] h-10 rounded-none bg-background text-foreground">
                <SelectValue placeholder="Motor Neural" />
              </SelectTrigger>
              <SelectContent className="bg-card border-2 border-border rounded-none">
                <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 2</SelectItem>
                <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek</SelectItem>
                <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3</SelectItem>
                <SelectItem value="groq-deepseek" className="font-black uppercase text-[10px]">Groq DeepSeek R1</SelectItem>
                <SelectItem value="puter" className="font-black uppercase text-[10px]">Puter AI</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={clearChat} className="border-border border-2 h-10 text-[10px] font-black uppercase hover:bg-primary hover:text-primary-foreground transition-all rounded-none bg-background text-foreground">
              <RefreshCcw size={12} className="mr-2" /> Reiniciar
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6">
          <Card className="max-w-4xl mx-auto bg-card border-border shadow-lg h-full flex flex-col rounded-sm overflow-hidden border-2">
            <ScrollArea className="flex-1 p-6 bg-muted/20" ref={scrollRef}>
              <div className="space-y-6">
                {chatMessages.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <div className="icon-3d-wrapper w-fit mx-auto">
                      <div className="icon-3d-block black w-16 h-16 rounded-sm">
                        <Bot className="text-white" size={32} />
                      </div>
                    </div>
                    <h2 className="text-xl font-black text-foreground uppercase">Como posso auxiliar a Get Assessoria hoje?</h2>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex group", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "p-4 rounded-none max-w-[85%] shadow-sm text-sm font-black uppercase transition-all border-2",
                      msg.role === 'user' ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t-2 border-border bg-card shrink-0">
              <form onSubmit={handleChat} className="flex gap-3">
                <Input placeholder="DÚVIDA TÉCNICA (GET ASSESSORIA)..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={loading} className="flex-1 border-2 border-border h-12 text-sm font-black text-foreground uppercase rounded-none bg-background" />
                <Button type="submit" size="icon" disabled={loading} className="h-12 w-12 bg-primary text-primary-foreground border-2 border-primary rounded-none">
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </Card>
        </div>
        <footer className="h-10 border-t border-border bg-card flex items-center justify-center gap-6 text-[10px] text-foreground/40 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
        </footer>
      </main>
    </div>
  );
}