
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Plus, Trash2, StickyNote, Lock, Search } from 'lucide-react';
import { CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/use-admin';
import { fetchRepoNotes, syncRepoNotes } from '@/app/actions/case-actions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NotesPage() {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const [newNote, setNewNote] = useState({ title: '', content: '' });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRepoNotes();
        if (Array.isArray(data)) {
          setNotes(data);
        }
      } catch (e) {
        console.error('Notes failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddNote = async () => {
    if (!isAdmin) return;
    if (!newNote.content.trim()) return;

    const note: CaseNote = {
      id: crypto.randomUUID(),
      title: newNote.title || 'Untitled Update',
      content: newNote.content,
      color: 'bg-sidebar/40',
      updatedAt: format(new Date(), 'dd/MM/yyyy HH:mm')
    };

    const updated = [note, ...notes];
    setNotes(updated);
    setNewNote({ title: '', content: '' });
    await syncRepoNotes(updated);
    toast({ title: "Update Saved", description: "Note synchronized to cloud." });
  };

  const deleteNote = async (id: string) => {
    if (!isAdmin) return;
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await syncRepoNotes(updated);
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
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl">Updates & Annotations</h1>
            {!isAdmin && (
              <Badge variant="secondary" className="bg-secondary/50 text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
                <Lock size={10} /> Visitor Mode
              </Badge>
            )}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Filter notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 bg-secondary border-none text-xs rounded-full focus-visible:ring-primary"
            />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          {isAdmin && (
            <section className="max-w-xl mx-auto bg-card border border-border p-4 rounded-2xl shadow-2xl space-y-3">
              <Input 
                placeholder="Title (Optional)" 
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="bg-transparent border-none text-sm font-bold placeholder:text-muted-foreground focus-visible:ring-0 px-0"
              />
              <Textarea 
                placeholder="Take a note/update..." 
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                className="bg-transparent border-none text-sm placeholder:text-muted-foreground focus-visible:ring-0 px-0 min-h-[40px] resize-none"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddNote} className="h-8 font-bold">
                  <Plus className="w-3.5 h-3.5 mr-2" /> Save Note
                </Button>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filteredNotes.length > 0 ? filteredNotes.map((note) => (
              <div key={note.id} className={cn(
                "p-5 rounded-xl border border-border transition-all hover:shadow-lg group relative",
                note.color || 'bg-sidebar/40'
              )}>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                <h3 className="font-bold text-sm mb-2">{note.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{note.updatedAt}</span>
                  <StickyNote size={12} className="text-muted-foreground/30" />
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl opacity-40">
                <p className="text-sm font-medium">No updates found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
