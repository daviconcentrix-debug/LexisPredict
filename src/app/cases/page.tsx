"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  RefreshCcw, 
  Plus, 
  Briefcase, 
  Edit2, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  FileText, 
  MessageCircle, 
  Info 
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { fetchRepoCases, syncRepoCases } from '@/app/actions/case-actions';
import { format } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

function CasesContent() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [obsDialogOpen, setObsDialogOpen] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const { isOperador, isAdmin } = useAdmin();
  const { toast } = useToast();

  const [formState, setFormState] = useState({
    cliente: '', protocolo: '', advogado: '', proximoPrazo: '',
    situacao: 'EM ANDAMENTO', ultimoRetorno: '', statusManual: 'Automatico' as any,
    observacao: '', telefone: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) setCases(repoData);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperador) return;
    const processed = processarCaso({ ...formState });
    const updated = editingCase ? cases.map(c => c.id === editingCase.id ? { ...processed, id: editingCase.id } : c) : [processed, ...cases];
    const result = await syncRepoCases(updated);
    if (result.success) {
      setCases(updated);
      setIsModalOpen(false);
      toast({ title: editingCase ? "Caso Atualizado" : "Caso Adicionado" });
    }
  };

  const filtered = useMemo(() => cases.filter(c => (c.cliente || '').toLowerCase().includes(search.toLowerCase()) || (c.protocolo || '').includes(search)), [cases, search]);

  return (
    <AppShell>
      <header className="h-16 border-b border-border/30 flex items-center justify-between px-8 shrink-0 bg-background/20 backdrop-blur-md">
        <h1 className="font-black text-sm uppercase tracking-widest">Processos</h1>
        <div className="flex items-center gap-3">
          {isOperador && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground font-black h-10 px-6 uppercase text-[10px]">
              <Plus className="w-3.5 h-3.5 mr-2" /> Novo
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={loadData} className="border-border/50"><RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} /></Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="bg-background/40 backdrop-blur-xl border border-border/50 rounded-lg overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-border/30 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="FILTRAR..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-background/20 border-border/30 text-[10px] font-black uppercase" />
            </div>
            <Badge variant="outline" className="h-10 px-4 uppercase text-[10px]">{filtered.length} Registros</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-foreground/5 border-b border-border/30">
                <tr className="text-[9px] font-black uppercase opacity-60">
                  <th className="px-6 py-4">Cliente / Protocolo</th>
                  <th className="px-6 py-4">Status / Prazo</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-foreground/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-black uppercase">{c.cliente}</p>
                      <p className="text-[9px] font-mono opacity-40">{c.protocolo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-primary text-[8px] uppercase">{c.status}</Badge>
                      <p className="text-[9px] opacity-40 mt-1">{c.proximoPrazo}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 font-black uppercase text-[10px]">Auditando Base...</div>}>
      <CasesContent />
    </Suspense>
  );
}
