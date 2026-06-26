
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Plus, Trash2, StickyNote, Lock, Search, RefreshCcw, Loader2 } from 'lucide-react';
import { CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/use-admin';
import { fetchRepoNotes, syncRepoNotes } from '@/app/actions/case-actions';
import { cn } from '@/lib/utils';

export default function NotesPage() {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoaded = useRef(false);
  const { isAdmin } = useAdmin();
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

  const handleAddNote = async () => {
    if (!isAdmin || isSaving) return;
    
    if (!newNote.content.trim()) {
      toast({ title: "Erro de Validação", description: "O conteúdo da nota não pode estar vazio.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    const note: CaseNote = {
      id: crypto.randomUUID(),
      title: newNote.title.trim() || 'Atualização sem Título',
      content: newNote.content.trim(),
      color: 'bg-sidebar/40',
      updatedAt: new Date().toLocaleString('pt-BR')
    };

    try {
      const updatedList = [note, ...notes];
      const result = await syncRepoNotes(updatedList);
      
      if (result.success) {
        setNotes(updatedList);
        setNewNote({ title: '', content: '' });
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
    if (!isAdmin || isSaving) return;
    
    const updated = notes.filter(n => n.id !== id);
    setIsSaving(true);
    
    try {
      const result = await syncRepoNotes(updated);
      if (result.success) {
        setNotes(updated);
        toast({ title: "Nota Excluída", description: "Base de dados cloud atualizada." });
      } else {
        toast({ title: "Erro ao Excluir", description: "Falha na sincronização cloud.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro Crítico", description: "Falha na comunicação.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!isAdmin || isSaving) return;
    
    const confirmClear = window.confirm('ATENÇÃO: Deseja apagar TODAS as notas estratégicas da nuvem permanentemente? Esta ação não pode ser desfeita.');
    if (!confirmClear) return;
    
    setIsSaving(true);
    try {
      const result = await syncRepoNotes([]);
      if (result.success) {
        setNotes([]);
        toast({ title: "Base de Dados Limpa", description: "Todos os registros foram removidos com sucesso." });
      } else {
        toast({ title: "Erro ao Limpar", description: "Falha na purga de dados cloud.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro Crítico", description: "Falha na comunicação com o servidor.", variant: "destructive" });
    } finally {
      setIsSaving(false);
      loadData(true); // Força recarga para garantir sincronia visual
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      (n.title || '').toLowerCase().includes(search.toLowerCase()) || 
      (n.content || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [notes, search]);

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Notas & Atualizações</h1>
            {!isAdmin && (
              <Badge variant="secondary" className="bg-secondary/50 text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
                <Lock size={10} /> Visitor Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Filtrar anotações..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9 bg-secondary border-none text-xs rounded-full focus-visible:ring-primary text-white"
              />
            </div>
            {isAdmin && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearAll} 
                disabled={isSaving}
                className="h-9 font-bold text-white px-4 border-none shadow-lg shadow-destructive/20"
              >
                <Trash2 className="w-4 h-4 mr-2" /> {isSaving ? "Sincronizando..." : "Limpar Tudo"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => loadData(true)} className="text-muted-foreground hover:text-white">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          {isAdmin && (
            <section className="max-w-xl mx-auto bg-card border border-border p-4 rounded-2xl shadow-2xl space-y-3">
              <Input 
                placeholder="Título da Anotação (Opcional)" 
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="bg-transparent border-none text-sm font-bold placeholder:text-muted-foreground focus-visible:ring-0 px-0 text-white"
                disabled={isSaving}
              />
              <Textarea 
                placeholder="Escreva aqui a atualização estratégica..." 
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                className="bg-transparent border-none text-sm placeholder:text-muted-foreground focus-visible:ring-0 px-0 min-h-[60px] resize-none text-white"
                disabled={isSaving}
              />
              <div className="flex justify-end pt-2">
                <Button 
                  size="sm" 
                  onClick={handleAddNote} 
                  disabled={isSaving || !newNote.content.trim()}
                  className="h-8 font-bold text-white px-6"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
                  {isSaving ? "Sincronizando..." : "Salvar Nota"}
                </Button>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filteredNotes.length > 0 ? filteredNotes.map((note) => (
              <div key={note.id} className={cn(
                "p-5 rounded-xl border border-border transition-all hover:shadow-lg group relative bg-sidebar/40"
              )}>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={isSaving}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                <h3 className="font-bold text-sm mb-2 text-white">{note.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{note.updatedAt}</span>
                  <StickyNote size={12} className="text-muted-foreground/30" />
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl opacity-40">
                <p className="text-sm font-medium text-white">{loading ? "Carregando inteligência cloud..." : "Nenhuma anotação estratégica encontrada."}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
