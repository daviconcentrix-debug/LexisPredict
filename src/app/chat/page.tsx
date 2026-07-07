"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MessageSquare, Send, Bot, User, Copyright, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatPage() {
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [model, setModel] = useState<'grok' | 'openrouter'>('grok');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    isMounted.current = true;
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'grok' || savedIA === 'openrouter') {
      setModel(savedIA as any);
    } else {
      setModel('grok');
    }
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
        preferredModel: model,
        deepThinking: localStorage.getItem('lexisPredict_deep_thinking') === 'true'
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
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-[#dddbda] px-6 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <MessageSquare size={20} className="text-white" />
              </div>
            </div>
            <h1 className="text-lg font-black text-black uppercase tracking-tight hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Consultoria de Gabinete</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-black font-black text-[10px] text-black uppercase px-3 py-1">
              {model.toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm" onClick={clearChat} className="border-black h-8 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">
              <RefreshCcw size={12} className="mr-2" /> Reiniciar
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6">
          <Card className="max-w-4xl mx-auto bg-white border-black shadow-lg h-full flex flex-col rounded-sm overflow-hidden border-2">
            <ScrollArea className="flex-1 p-6 bg-[#f3f2f2]" ref={scrollRef}>
              <div className="space-y-6">
                {chatMessages.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <div className="icon-3d-wrapper w-fit mx-auto">
                      <div className="icon-3d-block black w-16 h-16 rounded-sm">
                        <Bot className="text-white" size={32} />
                      </div>
                    </div>
                    <h2 className="text-xl font-black text-black uppercase">Como posso auxiliar hoje?</h2>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex group", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "p-4 rounded-none max-w-[85%] shadow-sm text-sm font-black uppercase transition-all border-2",
                      msg.role === 'user' ? "bg-black text-white border-black" : "bg-white border-black text-black"
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t-2 border-black bg-white shrink-0">
              <form onSubmit={handleChat} className="flex gap-3">
                <Input placeholder="DÚVIDA TÉCNICA..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={loading} className="flex-1 border-2 border-black h-12 text-sm font-black text-black uppercase rounded-none bg-white" />
                <Button type="submit" size="icon" disabled={loading} className="h-12 w-12 bg-black text-white border-2 border-black rounded-none">
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </Card>
        </div>
        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
        </footer>
      </main>
    </div>
  );
}