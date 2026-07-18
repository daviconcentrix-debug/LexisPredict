/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Send, RefreshCw, Loader2, BrainCircuit, Command, Sparkles, AlertCircle, Zap, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  engine?: string;
  isError?: boolean;
}

export default function ChatbotPrestigeWhite() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('xai-grok-4.5');
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setMessages([{
      role: 'assistant',
      content: 'Unidade Neural W1 Online. Analisando tendências estratégicas 2026–2027. Como posso servir ao seu gabinete hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: 'CORE-V8'
    }]);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const currentInput = input.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMessage: Message = { role: 'user', content: currentInput, timestamp: currentTime };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          model: selectedModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response || "Interferência crítica no cluster neural. Alterne o motor.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }]);
        return;
      }

      if (data.unlocked) {
        localStorage.setItem('lexis_master_unlock', 'true');
        toast({ title: "Portal Master Liberado", description: "Acesse as Configurações para exportação." });
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: data.engine
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Erro de Comunicação: Link Neural Offline.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-black">
              <Cpu size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase leading-none">Consultoria Neural</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">White Edition v80.0 Prestige</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-64 border-2 border-black h-10 bg-white font-black text-[10px] uppercase rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-black rounded-none">
                <SelectItem value="xai-grok-4.5" className="font-black text-[10px] uppercase">xAI Grok 4.5 Elite</SelectItem>
                <SelectItem value="xai-grok-2" className="font-black text-[10px] uppercase">xAI Grok 2.0</SelectItem>
                <SelectItem value="groq-llama" className="font-black text-[10px] uppercase">Groq Llama 3.3 Pro</SelectItem>
                <SelectItem value="groq-deepseek" className="font-black text-[10px] uppercase">Groq DeepSeek R1</SelectItem>
                <SelectItem value="airforce-v3" className="font-black text-[10px] uppercase">Airforce DeepSeek V3</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => setMessages([messages[0]])} className="h-10 w-10 border-2 border-black rounded-none hover:bg-black hover:text-white transition-all">
              <RefreshCw size={16} />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6 bg-white/50">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-4", msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  "w-9 h-9 border-2 border-black flex-shrink-0 flex items-center justify-center mt-1 rounded-none shadow-sm",
                  msg.role === 'assistant' ? (msg.isError ? "bg-red-50 text-red-600" : "bg-black text-white") : "bg-white text-black"
                )}>
                  {msg.role === 'assistant' ? (msg.isError ? <AlertCircle size={18} /> : <Sparkles size={18} />) : <Command size={18} />}
                </div>

                <div className={cn(
                  "max-w-[80%] p-5 rounded-none border-2 transition-all",
                  msg.role === 'user' ? "bg-black text-white border-black shadow-[4px_4px_0px_#00D1FF]" : "bg-white text-black border-black shadow-[4px_4px_0px_#000]"
                )}>
                  <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div className={cn("flex items-center gap-3 mt-4 text-[9px] font-black uppercase", msg.role === 'user' ? "text-white/40 justify-end" : "text-black/30")}>
                    <span>{msg.timestamp}</span>
                    {msg.engine && <span>• {msg.engine}</span>}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 items-center">
                <div className="w-9 h-9 bg-black text-white flex items-center justify-center border-2 border-black animate-pulse">
                  <Loader2 className="animate-spin" size={18} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Invocando clusters neurais...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-6 border-t-2 border-black bg-white">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida ou comando de segurança..."
              className="flex-1 border-2 border-black h-14 text-sm font-black uppercase rounded-none focus-visible:ring-0 bg-white"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading} className="h-14 w-14 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all rounded-none shadow-[4px_4px_0px_#00D1FF] hover:shadow-none">
              <Send size={20} />
            </Button>
          </form>
          <p className="text-center text-[9px] text-black/20 mt-4 font-black uppercase tracking-[0.4em]">W1 CAPITAL • UNIDADE NEURAL ELITE • 2026 PROTOCOL</p>
        </div>
      </main>
    </div>
  );
}
