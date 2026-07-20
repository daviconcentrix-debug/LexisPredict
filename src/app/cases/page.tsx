
"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import React, { useState, useEffect, useMemo, useCallback, Suspense, useDeferredValue, useRef } from 'react';
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
  Clock, 
  Copyright, 
  ShieldCheck, 
  FileText, 
  MessageCircle, 
  Info,
  Zap,
  Loader2,
  AlertTriangle,
  CalendarDays,
  Filter,
  Download,
  ShieldAlert
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
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { fetchRepoCases, syncRepoCases, deleteAllCasesAction } from '@/app/actions/case-actions';
import { exportCasesToCSVAction } from '@/app/actions/export-actions';
import { format } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';

const CaseRow = React.memo(({ 
  c, 
  isOperador, 
  onLogReturn, 
  onEdit, 
  onDelete 
}: { 
  c: LegalCase, 
  isOperador: boolean, 
  onLogReturn: (p: string) => void, 
  onEdit: (c: LegalCase) => void, 
  onDelete: (id: string) => void
}) => {
  return (
    <tr className="hover:bg-secondary/30 transition-all border-b border-border/50 group">
      <td className="px-8 py-5">
        <div className="flex flex-col gap-1">
          <span className="text-foreground font-black text-[13px] uppercase leading-none tracking-tight group-hover:text-primary transition-colors">{c.cliente}</span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{c.protocolo}</span>
        </div>
      </td>
      <td className="px-8 py-5">
        <Badge variant="outline" className="bg-white border-border/50 font-black text-[9px] text-muted-foreground uppercase rounded-md h-7 px-3">
          {c.tribunal}
        </Badge>
      </td>
      <td className="px-8 py-5 text-[11px] text-foreground font-bold uppercase">
        {c.advogado}
      </td>
      <td className="px-8 py-5">
        <div className="flex flex-col gap-2">
          <StatusBadge status={c.status} />
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
            <CalendarDays size={12} className="opacity-40" />
            <span>{c.proximoPrazo || 'Sem Prazo'}</span>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-border/50 flex items-center justify-center bg-gray-50 group-hover:bg-white transition-all">
            <Clock className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <span className="text-[11px] text-foreground font-bold uppercase whitespace-nowrap">
            {c.ultimoRetorno || 'S/ Registro'}
          </span>
        </div>
      </td>
      <td className="px-8 py-5 text-right">
        <div className="flex items-center justify-end gap-2">
          {c.telefone && (
             <Button title="WhatsApp" variant="ghost" size="icon" asChild className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all h-9 w-9 rounded-lg">
               <a href={formatWhatsAppLink(c.telefone)} target="_blank" rel="noopener noreferrer">
                 <MessageCircle size={18} />
               </a>
             </Button>
          )}
          <Button title="Tribunal" variant="ghost" size="icon" asChild className="text-muted-foreground hover:bg-secondary h-9 w-9 rounded-lg">
            <a href={c.linkConsulta} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={18} />
            </a>
          </Button>
          {isOperador && (
            <>
              <Button title="Editar" variant="ghost" size="icon" onClick={() => onEdit(c)} className="text-muted-foreground hover:bg-secondary h-9 w-9 rounded-lg">
                <Edit2 size={18} />
              </Button>
              <Button title="Excluir" variant="ghost" size="icon" onClick={() => onDelete(c.id)} className="text-muted-foreground hover:text-red-600 hover:bg-red-50 h-9 w-9 rounded-lg">
                <Trash2 size={18} />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

CaseRow.displayName = 'CaseRow';

function CasesContent() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const deferredSearch = useDeferredValue(search);
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isAdmin, isOperador } = useAdmin();
  const { toast } = useToast();
  const initialLoadDone = useRef(false);

  const [formState, setFormState] = useState({
    cliente: '',
    protocolo: '',
    advogado: '',
    proximoPrazo: '',
    situacao: 'EM ANDAMENTO',
    ultimoRetorno: '',
    statusManual: 'Automatico' as any,
    observacao: '',
    telefone: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) {
        setCases(repoData);
        initialLoadDone.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBatchUpdateStatus = useCallback(async (silent = false) => {
    if (!isOperador || cases.length === 0 || isUpdating) return;
    if (!silent) setIsUpdating(true);
    
    try {
      const savedThreshold = localStorage.getItem('lexisPredict_urgency_alert');
      const thresholds = { alertLimit: savedThreshold ? parseInt(savedThreshold) : 3 };

      const updatedCases = cases.map(c => {
        if (c.statusManual === 'Automatico' || !c.statusManual) {
          return processarCaso({ ...c }, thresholds);
        }
        return c;
      });

      const hasChanges = JSON.stringify(updatedCases.map(u => u.status)) !== JSON.stringify(cases.map(c => c.status));

      if (hasChanges) {
        const result = await syncRepoCases(updatedCases);
        if (result.success) {
          setCases(updatedCases);
          if (!silent) toast({ title: "Sincronia Concluída", description: "Todos os prazos foram recalculados." });
        }
      }
    } finally {
      if (!silent) setIsUpdating(false);
    }
  }, [cases, isOperador, isUpdating, toast]);

  const handleExportPlanilha = async () => {
    if (cases.length === 0 || isExporting) return;
    setIsExporting(true);
    
    try {
      const result = await exportCasesToCSVAction();
      if (result.success && result.base64) {
        const link = document.createElement('a');
        link.href = `data:text/csv;base64,${result.base64}`;
        link.download = result.filename || `export_processos.csv`;
        link.click();
        toast({ title: "Exportação Concluída", description: "Planilha gerada com sucesso." });
      } else {
        toast({ title: "Falha na Exportação", description: result.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro Crítico", description: "Não foi possível gerar o arquivo.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeDatabase = async () => {
    if (purgeConfirmText !== 'CONFIRME' || isPurging) return;
    setIsPurging(true);
    try {
      const res = await deleteAllCasesAction();
      if (res.success) {
        setCases([]);
        setIsPurgeModalOpen(false);
        setPurgeConfirmText('');
        toast({ title: "Base Purificada", description: "Todos os seus processos foram removidos." });
      } else {
        toast({ title: "Falha na Purga", description: res.error, variant: "destructive" });
      }
    } finally {
      setIsPurging(false);
    }
  };

  useEffect(() => { 
    setMounted(true);
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    if (!mounted || !isOperador) return;

    const recalibrate = async () => {
      if (initialLoadDone.current && cases.length > 0 && !isUpdating) {
        await handleBatchUpdateStatus(true);
      }
    };

    const timeout = setTimeout(recalibrate, 2000);
    const interval = setInterval(recalibrate, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') recalibrate();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [mounted, isOperador, cases.length, isUpdating, handleBatchUpdateStatus]);

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperador || !formState.cliente || !formState.protocolo) return;

    try {
      const savedThreshold = localStorage.getItem('lexisPredict_urgency_alert');
      const processed = processarCaso({
        id: editingCase?.id,
        CLIENTE: formState.cliente,
        PROTOCOLO: formState.protocolo,
        ADVOGADO: formState.advogado,
        'PRÓXIMO PRAZO': formState.proximoPrazo,
        SITUAÇÃO: formState.situacao,
        ULTIMO_RETORNO: formState.ultimoRetorno,
        STATUS_MANUAL: formState.statusManual,
        OBSERVACAO: formState.observacao,
        TELEFONE: formState.telefone
      }, { alertLimit: savedThreshold ? parseInt(savedThreshold) : 3 });

      const updated = editingCase 
        ? cases.map(c => c.id === editingCase.id ? processed : c)
        : [processed, ...cases];
      
      const result = await syncRepoCases(updated);
      if (result.success) {
        setCases(updated);
        setIsModalOpen(false);
        setEditingCase(null);
        toast({ title: "Registro Atualizado" });
      }
    } catch (err) {}
  };

  const handleLogReturn = useCallback(async (protocolo: string) => {
    if (!isOperador) return;
    const today = format(new Date(), 'dd/MM/yyyy');
    const updated = cases.map(c => c.protocolo === protocolo ? { ...c, ultimoRetorno: today } : c);
    setCases(updated);
    await syncRepoCases(updated);
    toast({ title: "Retorno Registrado" });
  }, [cases, isOperador, toast]);

  const handleEditClick = useCallback((c: LegalCase) => {
    if (!isOperador) return;
    setEditingCase(c);
    setFormState({
      cliente: c.cliente,
      protocolo: c.protocolo,
      advogado: c.advogado,
      proximoPrazo: c.proximoPrazo,
      situacao: c.situacao,
      ultimoRetorno: c.ultimoRetorno || '',
      statusManual: c.statusManual || 'Automatico',
      observacao: c.observacao || '',
      telefone: c.telefone || ''
    });
    setIsModalOpen(true);
  }, [isOperador]);

  const handleDeleteCase = useCallback(async (id: string) => {
    if (!isOperador) return;
    if (confirm('Deseja excluir definitivamente este registro?')) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      await syncRepoCases(updated);
      toast({ title: "Registro Removido" });
    }
  }, [cases, isOperador, toast]);

  const filtered = useMemo(() => {
    const searchLower = deferredSearch.toLowerCase();
    return cases.filter(c => 
      (c.cliente || '').toLowerCase().includes(searchLower) || 
      (c.protocolo || '').includes(deferredSearch)
    );
  }, [cases, deferredSearch]);

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-border/50 bg-white/60 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-foreground uppercase tracking-tight">Processos do Gabinete</h1>
            <Badge variant="outline" className="bg-secondary/50 border-none font-bold uppercase text-[9px] px-3 py-1 rounded-full">
              {isAdmin ? 'Privilégio Admin' : 'Operador'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {isOperador && (
               <Dialog open={isPurgeModalOpen} onOpenChange={setIsPurgeModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest text-red-600 hover:bg-red-50">
                    <Trash2 size={16} className="mr-2" /> Limpar Base
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl border-none shadow-2xl">
                   <DialogHeader>
                      <DialogTitle className="font-black uppercase text-red-600 flex items-center gap-2">
                        <ShieldAlert /> Ação Irreversível
                      </DialogTitle>
                      <DialogDescription className="font-bold uppercase text-[10px]">
                        Você está prestes a apagar todos os {cases.length} processos desta conta. Esta ação não pode ser desfeita.
                      </DialogDescription>
                   </DialogHeader>
                   <div className="py-6 space-y-4">
                      <Label className="font-black uppercase text-[10px] text-muted-foreground">Digite a palavra CONFIRME para prosseguir:</Label>
                      <Input 
                        value={purgeConfirmText}
                        onChange={(e) => setPurgeConfirmText(e.target.value.toUpperCase())}
                        placeholder="CONFIRME"
                        className="rounded-xl border-2 border-red-100 h-12 font-black uppercase text-center focus-visible:ring-red-600"
                      />
                   </div>
                   <DialogFooter>
                      <Button 
                        disabled={purgeConfirmText !== 'CONFIRME' || isPurging}
                        onClick={handlePurgeDatabase}
                        className="w-full h-12 bg-red-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest"
                      >
                        {isPurging ? <Loader2 className="animate-spin" /> : "Apagar Toda a Base Agora"}
                      </Button>
                   </DialogFooter>
                </DialogContent>
               </Dialog>
            )}
            {isOperador && (
              <Button onClick={handleExportPlanilha} disabled={isExporting || cases.length === 0} variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest text-muted-foreground hover:bg-secondary">
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download size={16} className="mr-2 text-primary" />}
                Extrair Planilha
              </Button>
            )}
            {isOperador && (
              <Button onClick={() => handleBatchUpdateStatus()} disabled={isUpdating} variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest text-muted-foreground hover:bg-secondary">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap size={16} className="mr-2 text-primary" />}
                Recalibrar
              </Button>
            )}
            {isOperador && (
              <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setEditingCase(null); }}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-6 rounded-xl bg-black text-white hover:bg-black/90 font-black uppercase text-[10px] tracking-widest shadow-xl">
                    <Plus className="w-4 h-4 mr-2 text-primary" /> Novo Registro
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] rounded-2xl overflow-hidden border-none shadow-2xl">
                  <form onSubmit={handleSaveCase}>
                    <DialogHeader className="p-6 bg-secondary/20 border-b">
                      <DialogTitle className="font-black uppercase tracking-tight">Gestão de Registro</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label className="uppercase text-[10px] font-black text-muted-foreground tracking-widest">Titular / Cliente</Label>
                          <Input value={formState.cliente} onChange={(e) => setFormState({...formState, cliente: e.target.value})} className="rounded-xl h-11 bg-secondary/20 border-none font-bold uppercase" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="uppercase text-[10px] font-black text-muted-foreground tracking-widest">CNJ / Protocolo</Label>
                          <Input value={formState.protocolo} onChange={(e) => setFormState({...formState, protocolo: e.target.value})} className="rounded-xl h-11 bg-secondary/20 border-none font-mono" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="grid gap-2">
                              <Label className="uppercase text-[10px] font-black text-muted-foreground tracking-widest">Advogado</Label>
                              <Input value={formState.advogado} onChange={(e) => setFormState({...formState, advogado: e.target.value})} className="rounded-xl h-11 bg-secondary/20 border-none font-bold uppercase" />
                           </div>
                           <div className="grid gap-2">
                              <Label className="uppercase text-[10px] font-black text-muted-foreground tracking-widest">Prazo Final</Label>
                              <Input value={formState.proximoPrazo} onChange={(e) => setFormState({...formState, proximoPrazo: e.target.value})} className="rounded-xl h-11 bg-secondary/20 border-none" placeholder="DD/MM/AAAA" />
                           </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="p-6 pt-0">
                      <Button type="submit" className="w-full h-12 bg-black text-white hover:bg-black/90 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl">
                        Sincronizar Dados
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="ghost" size="icon" onClick={loadData} className="h-10 w-10 rounded-xl hover:bg-secondary">
              <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="premium-card flex-1 flex flex-col overflow-hidden border-none bg-white">
            <div className="p-5 border-b border-border/30 flex items-center justify-between gap-6 shrink-0">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Pesquisar por titular ou protocolo judicial..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-11 bg-secondary/30 border-none rounded-xl text-xs font-bold uppercase focus-visible:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-3">
                 <Badge className="bg-black text-white text-[10px] font-black uppercase h-9 px-5 rounded-lg flex items-center gap-2 border-none">
                   <Filter size={14} className="text-primary" /> {filtered.length} Registros
                 </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {filtered.length > 0 ? (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-white z-20 border-b border-border shadow-sm">
                    <tr className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      <th className="px-8 py-5">Identificação</th>
                      <th className="px-8 py-5">Tribunal</th>
                      <th className="px-8 py-5">Advocacia</th>
                      <th className="px-8 py-5">Vencimento</th>
                      <th className="px-8 py-5">Telemetria</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filtered.map((c) => (
                      <CaseRow 
                        key={c.id} 
                        c={c} 
                        isOperador={isOperador} 
                        onLogReturn={handleLogReturn} 
                        onEdit={handleEditClick} 
                        onDelete={handleDeleteCase}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <EmptyState 
                    icon={Briefcase} 
                    title={loading ? "Sincronizando..." : "Base Vazia"} 
                    description={loading ? "Acessando repositório de alta segurança." : "Não localizamos processos com este filtro."}
                    actionLabel={!loading && isOperador ? "Adicionar Caso" : undefined}
                    onAction={() => setIsModalOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-border/30 bg-white flex items-center justify-center gap-6 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.3em] shrink-0">
          <Copyright size={10} /> 2026 W1 Capital • Advanced Legal Operations
        </footer>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: any }) {
  const styles: Record<string, string> = {
    'Vencido': "bg-red-50 text-red-700 border-red-100",
    'É Hoje': "bg-blue-50 text-blue-700 border-blue-100 animate-pulse",
    'Caso Crítico': "bg-red-50 text-red-700 border-red-100",
    'Atenção': "bg-orange-50 text-orange-700 border-orange-100",
    'No Prazo': "bg-emerald-50 text-emerald-700 border-emerald-100",
    'Arquivado': "bg-gray-100 text-gray-700 border-gray-200",
    'Encerrado': "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <Badge variant="outline" className={cn("px-3 py-1 text-[10px] font-black uppercase rounded-lg border-none", styles[status] || "bg-secondary text-muted-foreground")}>
      {status}
    </Badge>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-10 font-black uppercase text-xs tracking-widest text-muted-foreground">Sincronizando Gabinete...</div>}>
      <CasesContent />
    </Suspense>
  );
}
