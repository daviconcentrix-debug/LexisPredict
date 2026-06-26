
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Copyright,
  Clock,
  MoreHorizontal,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { perguntarIA } from '@/ai/flows/chat-ai-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatPage() {
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [model, setModel] = useState<'gemini' | 'grok' | 'openrouter'>('gemini');
  const [deepThinking, setDeepThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'grok' || savedIA === 'gemini' || savedIA === 'openrouter') setModel(savedIA as any);
    const savedThinking = localStorage.getItem('lexisPredict_deep_thinking');
    if (savedThinking === 'true') setDeepThinking(true);
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
        deepThinking
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response.resposta }]);
    } catch (error: any) {
      toast({ title: "Falha na Resposta", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
        <header className="h-16 bg-[#f8f9fb] border-b border-[#dddbda] px-6 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <MessageSquare size={20} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black text-black uppercase tracking-tight">Consultoria de Gabinete</h1>
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest">Suporte Técnico Avançado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-black font-black text-[10px] text-black uppercase px-3 py-1">
              Engine: {model.toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm" onClick={clearChat} className="border-black h-8 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">
              <RefreshCcw size={12} className="mr-2" /> Reiniciar Diálogo
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6">
          <Card className="max-w-4xl mx-auto bg-white border-black shadow-lg h-full flex flex-col rounded-sm overflow-hidden">
            <ScrollArea className="flex-1 p-6 bg-[#f3f2f2]" ref={scrollRef}>
              <div className="space-y-6">
                {chatMessages.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-xl">
                      <Bot className="text-white" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-black uppercase tracking-tighter">Como posso auxiliar sua análise técnica hoje?</h2>
                    <p className="text-xs text-black/60 font-black uppercase max-w-sm mx-auto">Inicie uma conversa para extrair insights estratégicos ou resolver dúvidas procedurais.</p>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex group", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "p-4 rounded-lg max-w-[85%] shadow-sm text-sm font-black uppercase transition-all border",
                      msg.role === 'user' 
                        ? "bg-black text-white border-white/20" 
                        : "bg-white border-black text-black hover:bg-black hover:text-white"
                    )}>
                      <div className="flex items-center gap-2 mb-2 opacity-50">
                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                        <span className="text-[10px] tracking-widest">{msg.role === 'user' ? 'GABINETE' : 'CONSULTOR'}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-black p-4 rounded-lg shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-black bg-white shrink-0">
              <form onSubmit={handleChat} className="flex gap-3">
                <Input 
                  placeholder="DIGITE SUA DÚVIDA TÉCNICA..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-[#f3f2f2] border-black h-12 text-sm font-black text-black uppercase focus-visible:ring-0"
                />
                <Button type="submit" size="icon" disabled={loading || !chatInput.trim()} className="h-12 w-12 bg-black text-white hover:bg-gray-800 border-none transition-all shadow-lg">
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <footer className="h-10 border-t border-black bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 hover:text-black transition-colors cursor-default">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
          </div>
          <span className="w-1 h-1 bg-black rounded-full opacity-30" />
          <span className="text-black uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}
