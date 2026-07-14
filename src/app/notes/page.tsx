
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Plus, Trash2, StickyNote, Lock, Search, RefreshCcw, Loader2, Image as ImageIcon, X, Maximize2, Copyright, ShieldCheck } from 'lucide-react';
import { CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/use-admin';
import { fetchRepoNotes, syncRepoNotes } from '@/app/actions/case-actions';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NotesPage() {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOperador, isAdmin } = useAdmin();
  const { toast } = useToast();

  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const loadData = useCallback(async (force = false) => {
    if (!force && hasLoaded.current) return;
    
    setLoading(true);
    try {
      const data = await fetchRepoNotes();
      if (Array.isArray(data)) {
        setNotes(data);
        hasLoaded.current = true;
      }
    } catch (e) {
      console.error('Notes failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNote = async () => {
    if (!isOperador || isSaving) return;
    
    if (!newNote.content.trim()) {
      toast({ title: "Erro de Validação", description: "O conteúdo da nota não pode estar vazio.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    const note: CaseNote = {
      id: crypto.randomUUID(),
      title: newNote.title.trim() || 'Atualização sem Título',
      content: newNote.content.trim(),
      imageUrl: imagePreview || undefined,
      color: 'bg-sidebar/40',
      updatedAt: new Date().toLocaleString('pt-BR')
    };

    try {
      const updatedList = [note, ...notes];
      const result = await syncRepoNotes(updatedList);
      
      if (result.success) {
        setNotes(updatedList);
        setNewNote({ title: '', content: '' });
        setImagePreview(null);
        toast({ title: "Atualização Salva", description: "Nota sincronizada com a nuvem W1 Capital." });
      } else {
        toast({ title: "Erro de Sincronização", description: "Falha ao salvar na nuvem.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro Crítico", description: "Falha na comunicação com o banco de dados.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!isOperador || isSaving) return;
    
    const updated = notes.filter(n => n.id !== id);
    setIsSaving(true);
    
    try {
      const result = await syncRepoNotes(updated);
      if (result.success) {
        setNotes(updated);
        toast({ title: "Nota Excluída", description: "Base de dados cloud atualizada." });
      }
    } catch (e) {
      toast({ title: "Erro Crítico", description: "Falha na comunicação.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!isAdmin || isSaving) return;
    
    const confirmClear = window.confirm('ATENÇÃO: Deseja apagar TODAS as suas notas estratégicas permanentemente?');
    if (!confirmClear) return;
    
    setIsSaving(true);
    try {
      const result = await syncRepoNotes([]);
      if (result.success) {
        setNotes([]);
        toast({ title: "Minhas Notas Removidas" });
      }
    } catch (e) {
      toast({ title: "Erro Crítico", description: "Falha na comunicação.", variant: "destructive" });
    } finally {
      setIsSaving(false);
      loadData(true);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      (n.title || '').toLowerCase().includes(search.toLowerCase()) || 
      (n.content || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [notes, search]);

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-black relative z-10">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">
              {isAdmin ? "Anotações Gerais de Auditoria" : "Minhas Notas Estratégicas"}
            </h1>
            <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px] px-3 py-1 flex items-center gap-1.5 tracking-tighter">
              <ShieldCheck size={10} /> {isAdmin ? 'Modo Global' : 'Modo Privado'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
              <Input 
                placeholder="FILTRAR EVIDÊNCIAS..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-white border-black border-2 text-[10px] font-black uppercase focus-visible:ring-0 text-black"
              />
            </div>
            {isOperador && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearAll} 
                disabled={isSaving}
                className="h-10 font-black text-white px-6 uppercase text-[10px] border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-none"
              >
                <Trash2 className="w-4 h-4 mr-2" /> {isSaving ? "Limpando..." : "Limpar Notas"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => loadData(true)} className="text-black hover:bg-black hover:text-white border-2 border-black h-10 w-10">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          {isOperador && (
            <section className="max-w-xl mx-auto bg-white border-2 border-black p-6 rounded-none shadow-[10px_10px_0px_#000] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-black text-white text-[9px] font-black uppercase rounded-none">Nova Evidência</Badge>
              </div>
              <Input 
                placeholder="TÍTULO DA ANOTAÇÃO (OPCIONAL)" 
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="bg-transparent border-none text-[12px] font-black placeholder:text-black/30 focus-visible:ring-0 px-0 text-black uppercase"
                disabled={isSaving}
              />
              <Textarea 
                placeholder="ESCREVA AQUI A ATUALIZAÇÃO ESTRATÉGICA..." 
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                className="bg-transparent border-none text-[12px] placeholder:text-black/30 focus-visible:ring-0 px-0 min-h-[100px] resize-none text-black font-black uppercase leading-relaxed"
                disabled={isSaving}
              />
              
              {imagePreview && (
                <div className="relative w-32 h-32 rounded-none overflow-hidden border-2 border-black group">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button 
                    onClick={() => setImagePreview(null)}
                    className="absolute top-1 right-1 bg-black text-white rounded-none p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t-2 border-black/5">
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-black hover:bg-black hover:text-white border-2 border-black h-10 w-10 transition-all"
                    disabled={isSaving}
                  >
                    <ImageIcon size={18} />
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleAddNote} 
                  disabled={isSaving || !newNote.content.trim()}
                  className="h-10 font-black bg-white text-black border-2 border-black hover:bg-black hover:text-white px-10 uppercase text-[10px] transition-all shadow-[4px_4px_0px_#000] hover:shadow-none"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
                  {isSaving ? "Sincronizando..." : "Salvar Nota"}
                </Button>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
            {filteredNotes.length > 0 ? filteredNotes.map((note) => (
              <div key={note.id} className={cn(
                "p-6 bg-white border-2 border-black rounded-none transition-all hover:bg-black group relative flex flex-col h-full cursor-default shadow-[6px_6px_0px_#000] hover:shadow-none"
              )}>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                   {note.imageUrl && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setFullscreenImage(note.imageUrl!)}
                      className="h-8 w-8 bg-white text-black hover:bg-white/90 border-2 border-black rounded-none shadow-sm"
                    >
                      <Maximize2 size={14} />
                    </Button>
                  )}
                  {isOperador && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isSaving}
                      className="h-8 w-8 bg-white text-black hover:bg-red-600 hover:text-white border-2 border-black rounded-none shadow-sm"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                
                {note.imageUrl && (
                  <div className="relative w-full h-44 mb-5 rounded-none overflow-hidden border-2 border-black group-hover:border-white/20 transition-all cursor-pointer shadow-sm" onClick={() => setFullscreenImage(note.imageUrl!)}>
                    <Image src={note.imageUrl} alt="Note Attachment" fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                  </div>
                )}

                <h3 className="font-black text-[13px] mb-3 text-black group-hover:text-white uppercase transition-colors tracking-tight leading-tight">{note.title}</h3>
                <p className="text-[11px] text-black/60 group-hover:text-white/80 leading-relaxed font-black uppercase whitespace-pre-wrap flex-1 transition-colors tracking-widest">{note.content}</p>
                
                <div className="mt-5 pt-5 border-t-2 border-black/5 group-hover:border-white/20 flex justify-between items-center transition-all">
                  <span className="text-[9px] text-black/40 group-hover:text-white/40 font-black uppercase tracking-[0.2em]">{note.updatedAt}</span>
                  <StickyNote size={14} className="text-black/20 group-hover:text-white/20" />
                </div>
              </div>
            )) : (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-black/20 rounded-none opacity-40">
                <p className="text-[11px] font-black text-black uppercase tracking-[0.3em]">{loading ? "Consolidando Visão por Perfil..." : "Nenhuma anotação estratégica localizada."}</p>
              </div>
            )}
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 hover:bg-black hover:text-white transition-all cursor-default">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
          </div>
          <span className="w-1 h-1 bg-black rounded-full opacity-30 group-hover:bg-white" />
          <span className="uppercase font-black">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>

        <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
          <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/95 border-none overflow-hidden flex flex-col items-center justify-center">
            <DialogHeader className="sr-only">
              <DialogTitle>Visualização de Evidência Técnica</DialogTitle>
            </DialogHeader>
            {fullscreenImage && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={fullscreenImage} 
                  alt="Evidência Fullscreen" 
                  className="max-w-full max-h-full object-contain shadow-2xl border-2 border-white/10"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setFullscreenImage(null)}
                  className="absolute top-8 right-8 text-white bg-black/40 hover:bg-black rounded-none h-14 w-14 z-50 border-2 border-white/20"
                >
                  <X size={32} />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
