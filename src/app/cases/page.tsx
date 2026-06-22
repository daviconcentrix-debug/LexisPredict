"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  RefreshCcw,
  Plus,
  Briefcase,
  Edit2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { fetchRepoCases, syncRepoCases } from '@/app/actions/case-actions';
import { format } from 'date-fns';

function CasesContent() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const { toast } = useToast();

  const [formState, setFormState] = useState({
    cliente: '',
    protocolo: '',
    advogado: '',
    proximoPrazo: '',
    situacao: 'EM ANDAMENTO',
    ultimoRetorno: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) {
        setCases(repoData);
        localStorage.setItem('lexisPredict_cloud_cache', JSON.stringify(repoData));
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.cliente || !formState.protocolo) {
      toast({ title: "Validation Error", description: "Name and Protocol are required.", variant: "destructive" });
      return;
    }

    const processed = processarCaso({
      CLIENTE: formState.cliente,
      PROTOCOLO: formState.protocolo,
      ADVOGADO: formState.advogado,
      'PRÓXIMO PRAZO': formState.proximoPrazo,
      SITUAÇÃO: formState.situacao,
      ULTIMO_RETORNO: formState.ultimoRetorno
    });

    const updated = cases.map(c => c.protocolo === processed.protocolo ? processed : c);
    if (!cases.find(c => c.protocolo === processed.protocolo)) {
      updated.push(processed);
    }
    
    const result = await syncRepoCases(updated);
    if (result.success) {
      setCases(updated);
      setIsModalOpen(false);
      setEditingCase(null);
      setFormState({ cliente: '', protocolo: '', advogado: '', proximoPrazo: '', situacao: 'EM ANDAMENTO', ultimoRetorno: '' });
      toast({ title: editingCase ? "Case Updated" : "Case Added", description: "Successfully synchronized with cloud database." });
    }
  };

  const handleLogReturn = async (protocolo: string) => {
    const today = format(new Date(), 'dd/MM/yyyy');
    const updated = cases.map(c => {
      if (c.protocolo === protocolo) {
        return { ...c, ultimoRetorno: today };
      }
      return c;
    });

    setCases(updated);
    const result = await syncRepoCases(updated);
    if (result.success) {
      toast({ title: "Return Logged", description: `Contact confirmed for today (${today}).` });
    }
  };

  const handleEditClick = (c: LegalCase) => {
    setEditingCase(c);
    setFormState({
      cliente: c.cliente,
      protocolo: c.protocolo,
      advogado: c.advogado,
      proximoPrazo: c.proximoPrazo,
      situacao: c.situacao,
      ultimoRetorno: c.ultimoRetorno || ''
    });
    setIsModalOpen(true);
  };

  const deleteCase = async (id: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      await syncRepoCases(updated);
      toast({ title: "Case Deleted", description: "Cloud database updated." });
    }
  };

  const clearAll = async () => {
    if (confirm('DANGER: This will wipe ALL cases from the cloud. Continue?')) {
      setCases([]);
      await syncRepoCases([]);
      toast({ title: "Database Wiped", description: "The cloud storage is now empty.", variant: "destructive" });
    }
  };

  const filtered = useMemo(() => {
    return cases.filter(c => 
      (c.cliente || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.protocolo || '').includes(search) ||
      (c.advogado && c.advogado.toLowerCase().includes(search.toLowerCase()))
    );
  }, [cases, search]);

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Case Management</h1>
            <Badge variant="outline" className="text-muted-foreground">{filtered.length} active records</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                setEditingCase(null);
                setFormState({ cliente: '', protocolo: '', advogado: '', proximoPrazo: '', situacao: 'EM ANDAMENTO', ultimoRetorno: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 font-bold h-8">
                  <Plus className="w-3.5 h-3.5 mr-2" /> New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-white sm:max-w-[425px]">
                <form onSubmit={handleSaveCase}>
                  <DialogHeader>
                    <DialogTitle>{editingCase ? "Edit Case Entry" : "Manual Case Registry"}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {editingCase ? "Update existing procedural details." : "Input new procedural details."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Client Name</Label>
                      <Input id="name" value={formState.cliente} onChange={(e) => setFormState({...formState, cliente: e.target.value})} className="bg-secondary border-none" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="protocol">CNJ Protocol</Label>
                      <Input id="protocol" placeholder="0000000-00.2025.8.00.0000" value={formState.protocolo} onChange={(e) => setFormState({...formState, protocolo: e.target.value})} className="bg-secondary border-none" disabled={!!editingCase} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="attorney">Attorney</Label>
                        <Input id="attorney" value={formState.advogado} onChange={(e) => setFormState({...formState, advogado: e.target.value})} className="bg-secondary border-none" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="deadline">Deadline (DD/MM/YYYY)</Label>
                        <Input id="deadline" placeholder="30/12/2026" value={formState.proximoPrazo} onChange={(e) => setFormState({...formState, proximoPrazo: e.target.value})} className="bg-secondary border-none" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ultimoRetorno">Last Return Date (DD/MM/YYYY)</Label>
                      <Input id="ultimoRetorno" placeholder="22/06/2026" value={formState.ultimoRetorno} onChange={(e) => setFormState({...formState, ultimoRetorno: e.target.value})} className="bg-secondary border-none" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full font-bold">{editingCase ? "Update Record" : "Register in Cloud"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm" onClick={loadData} className="h-8 text-muted-foreground hover:text-white border border-border">
              <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} /> Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAll} className="h-8 font-bold">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search name, protocol, or attorney..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-secondary border-none h-10 text-sm focus-visible:ring-primary text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    <th className="px-6 py-4">Client / CNJ Protocol</th>
                    <th className="px-6 py-4">Tribunal</th>
                    <th className="px-6 py-4">Assigned Attorney</th>
                    <th className="px-6 py-4">Procedural Status</th>
                    <th className="px-6 py-4">Last Return</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length > 0 ? filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{c.cliente}</span>
                          <span className="text-xs font-mono text-muted-foreground mt-0.5 tracking-tight">{c.protocolo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="secondary" className="bg-sidebar border-border font-bold text-[10px] text-white">
                          {c.tribunal}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-sm text-muted-foreground font-medium">
                        {c.advogado}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={c.status} />
                          <p className="text-[10px] text-muted-foreground font-medium">{c.proximoPrazo || 'No Deadline Set'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">
                            {c.ultimoRetorno || 'Never Contacted'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleLogReturn(c.protocolo)} 
                            title="Confirm Contact Today"
                            className="text-muted-foreground hover:text-chart-3"
                          >
                            <CheckCircle size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(c)} className="text-muted-foreground hover:text-white">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-white">
                            <a href={c.linkConsulta} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={16} />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCase(c.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="max-w-xs mx-auto space-y-3">
                          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto">
                            <Briefcase className="text-muted-foreground" />
                          </div>
                          <h3 className="text-white font-bold">{loading ? "Loading CRM Data..." : "No Cases Found"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Database is currently empty. Use "New Case" or Migration tool.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: LegalCase['status'] }) {
  const styles = {
    'Vencido': "bg-destructive/10 text-destructive border-destructive/20",
    'Atenção': "bg-accent/10 text-accent border-accent/20",
    'No Prazo': "bg-chart-3/10 text-chart-3 border-chart-3/20",
    'Arquivado': "bg-muted text-muted-foreground border-border",
    'Sem Prazo': "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge className={cn("px-2 py-0.5 font-bold text-[10px] uppercase tracking-tighter", styles[status])}>
      {status}
    </Badge>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading interface...</div>}>
      <CasesContent />
    </Suspense>
  );
}
