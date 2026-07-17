/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, useDeferredValue } from 'react';
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
  CalendarDays
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
import { EmptyState } from '@/components/ui/empty-state';

const CaseRow = React.memo(({ 
  c, 
  isOperador, 
  onLogReturn, 
  onEdit, 
  onDelete, 
  onShowObs 
}: { 
  c: LegalCase, 
  isOperador: boolean, 
  onLogReturn: (p: string) => void, 
  onEdit: (c: LegalCase) => void, 
  onDelete: (id: string) => void,
  onShowObs: (obs: string) => void
}) => {
  return (
    <tr className="hover:bg-black group transition-all cursor-default border-b border-black/5 hover:border-black/20">
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="text-black font-black text-xs lg:text-sm group-hover:text-white transition-colors uppercase leading-none">{c.cliente}</span>
          <span className="text-[9px] lg:text-[10px] font-mono text-black/60 group-hover:text-white/60 mt-2 uppercase">{c.protocolo}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <Badge variant="outline" className="bg-white border-black border-2 font-black text-[8px] lg:text-[9px] text-black group-hover:bg-white group-hover:text-black uppercase rounded-none">
          {c.tribunal}
        </Badge>
      </td>
      <td className="px-6 py-5 text-[10px] lg:text-[11px] text-black font-black uppercase group-hover:text-white transition-colors">
        {c.advogado}
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col gap-2">
          <StatusBadge status={c.status} />
          <div className="flex items-center gap-1 text-[9px] lg:text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase">
            <CalendarDays size={10} />
            <span>{c.proximoPrazo || 'Sem Prazo'}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center bg-gray-50 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
            <Clock className="w-3.5 h-3.5 text-black/40 group-hover:text-white/40" />
          </div>
          <span className="text-[10px] lg:text-[11px] text-black group-hover:text-white font-black uppercase whitespace-nowrap">
            {c.ultimoRetorno || 'S/ Registro'}
          </span>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          {c.telefone && (
             <Button title="WhatsApp" variant="ghost" size="icon" asChild className="text-green-600 group-hover:text-green-400 hover:bg-black transition-all h-9 w-9 border-2 border-transparent hover:border-green-600">
               <a href={formatWhatsAppLink(c.telefone)} target="_blank" rel="noopener noreferrer">
                 <MessageCircle size={18} />
               </a>
             </Button>
          )}
          {c.observacao && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-black group-hover:text-white h-9 w-9 border-2 border-transparent hover:border-white" 
              onClick={() => onShowObs(c.observacao || '')}
            >
              <FileText size={18} />
            </Button>
          )}
          {isOperador && (
            <>
              <Button 
                title="Retorno"
                variant="ghost" 
                size="icon" 
                onClick={() => onLogReturn(c.protocolo)} 
                className="text-black group-hover:text-[#00D1FF] hover:bg-black transition-all h-9 w-9 border-2 border-transparent hover:border-[#00D1FF]"
              >
                <CheckCircle size={18} />
              </Button>
              <Button title="Editar" variant="ghost" size="icon" onClick={() => handleEditClick(c)} className="text-black group-hover:text-white hover:bg-black transition-all h-9 w-9 border-2 border-transparent hover:border-white">
                <Edit2 size={18} />
              </Button>
            </>
          )}
          <Button title="Tribunal" variant="ghost" size="icon" asChild className="text-black group-hover:text-white hover:bg-black transition-all h-9 w-9 border-2 border-transparent hover:border-white">
            <a href={c.linkConsulta} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={18} />
            </a>
          </Button>
          {isOperador && (
            <Button title="Excluir" variant="ghost" size="icon" onClick={() => onDelete(c.id)} className="text-black group-hover:text-red-500 hover:bg-black transition-all h-9 w-9 border-2 border-transparent hover:border-red-500">
              <Trash2 size={18} />
            </Button>
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [obsDialogOpen, setObsDialogOpen] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const { isAdmin, isOperador } = useAdmin();
  const { toast } = useToast();

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

  const getThresholds = useCallback(() => {
    const saved = localStorage.getItem('lexisPredict_urgency_alert');
    return { alertLimit: saved ? parseInt(saved) : 3 };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) {
        setCases(repoData);
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

  const handleBatchUpdateStatus = useCallback(async (silent = false) => {
    if (!isOperador || cases.length === 0 || isUpdating) return;
    
    if (!silent) setIsUpdating(true);
    const thresholds = getThresholds();
    
    try {
      const updatedCases = cases.map(c => {
        if (c.statusManual === 'Automatico' || !c.statusManual) {
          return processarCaso({ ...c, id: c.id }, thresholds);
        }
        return c;
      });

      const result = await syncRepoCases(updatedCases);
      if (result.success) {
        setCases(updatedCases);
        if (!silent) toast({ title: "Gabinete Recalibrado", description: "Todos os status foram atualizados conforme os parâmetros de urgência." });
      }
    } catch (e) {
      if (!silent) toast({ title: "Falha na Recalibração", variant: "destructive" });
    } finally {
      if (!silent) setIsUpdating(false);
    }
  }, [cases, isOperador, isUpdating, toast, getThresholds]);

  useEffect(() => {
    if (!isOperador) return;
    
    const interval = setInterval(() => {
      handleBatchUpdateStatus(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [isOperador, handleBatchUpdateStatus]);

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperador) return;
    
    if (!formState.cliente || !formState.protocolo) {
      toast({ title: "Erro de Validação", description: "Nome e Protocolo são obrigatórios.", variant: "destructive" });
      return;
    }

    const thresholds = getThresholds();

    try {
      const processed = processarCaso({
        id: editingCase?.id,
        CLIENTE: formState.cliente,
        PROTOCOLO: formState.protocolo,
        ADVOCADO: formState.advogado,
        'ADVOGADO RESPONSÁVEL': formState.advogado,
        'PRÓXIMO PRAZO': formState.proximoPrazo,
        SITUAÇÃO: formState.situacao,
        ULTIMO_RETORNO: formState.ultimoRetorno,
        STATUS_MANUAL: formState.statusManual,
        OBSERVACAO: formState.observacao,
        TELEFONE: formState.telefone
      }, thresholds);

      const updated = editingCase 
        ? cases.map(c => c.id === editingCase.id ? processed : c)
        : [processed, ...cases];
      
      const result = await syncRepoCases(updated);
      if (result.success) {
        setCases(updated);
        setIsModalOpen(false);
        setEditingCase(null);
        setFormState({ 
          cliente: '', 
          protocolo: '', 
          advogado: '', 
          proximoPrazo: '', 
          situacao: 'EM ANDAMENTO', 
          ultimoRetorno: '',
          statusManual: 'Automatico',
          observacao: '',
          telefone: ''
        });
        toast({ title: editingCase ? "Caso Atualizado" : "Caso Adicionado" });
      } else {
        toast({ title: "Falha na Sincronia", description: result.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro no Processamento", description: err.message, variant: "destructive" });
    }
  };

  const handleLogReturn = useCallback(async (protocolo: string) => {
    if (!isOperador) return;
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
      toast({ title: "Retorno Registrado", description: `Contato confirmado hoje (${today}).` });
    }
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
    if (confirm('Tem certeza que deseja excluir este caso?')) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      await syncRepoCases(updated);
      toast({ title: "Caso Excluído" });
    }
  }, [cases, isOperador, toast]);

  const filtered = useMemo(() => {
    const searchLower = deferredSearch.toLowerCase();
    return cases.filter(c => 
      (c.cliente || '').toLowerCase().includes(searchLower) || 
      (c.protocolo || '').includes(deferredSearch) ||
      (c.advogado && c.advogado.toLowerCase().includes(searchLower))
    );
  }, [cases, deferredSearch]);

  const onShowObs = useCallback((obs: string) => {
    setObsDialogOpen(obs);
  }, []);

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 border-b border-[#dddbda] bg-white/90 backdrop-blur-sm flex items-center justify-between px-6 lg:px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-lg lg:text-xl text-black uppercase tracking-tighter">Processos de Gabinete</h1>
            <Badge variant="outline" className="hidden sm:flex text-black font-black border-black border-2 px-3 py-1 items-center gap-1.5 uppercase text-[9px] lg:text-[10px]">
              <ShieldCheck size={10} /> {isAdmin ? 'Admin' : 'Operador'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isOperador && (
              <Button 
                onClick={() => handleBatchUpdateStatus()} 
                disabled={isUpdating || cases.length === 0}
                variant="outline"
                className="border-2 border-black font-black uppercase h-10 text-[10px] px-4 rounded-none hover:bg-black hover:text-white transition-all hidden md:flex"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Zap className="w-3.5 h-3.5 mr-2 text-yellow-500 fill-yellow-500" />}
                Recalibrar Prazos
              </Button>
            )}
            {isOperador && (
              <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setEditingCase(null); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCase(null)} className="bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black h-10 uppercase text-[10px] px-6 transition-all rounded-none">
                    <Plus className="w-3.5 h-3.5 mr-2" /> Novo Caso
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-2 border-black text-black sm:max-w-[425px] rounded-none max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleSaveCase}>
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase text-black">Registro de Caso</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-1">
                        <Label className="uppercase text-[9px] font-black">Cliente</Label>
                        <Input value={formState.cliente} onChange={(e) => setFormState({...formState, cliente: e.target.value})} className="border-black font-black uppercase rounded-none h-11" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="uppercase text-[9px] font-black">Protocolo CNJ</Label>
                        <Input value={formState.protocolo} onChange={(e) => setFormState({...formState, protocolo: e.target.value})} className="border-black font-black rounded-none h-11" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                           <Label className="uppercase text-[9px] font-black">Advogado</Label>
                           <Input value={formState.advogado} onChange={(e) => setFormState({...formState, advogado: e.target.value})} className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                        <div className="grid gap-1">
                           <Label className="uppercase text-[9px] font-black">WhatsApp</Label>
                           <Input value={formState.telefone} onChange={(e) => setFormState({...formState, telefone: e.target.value})} className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                          <Label className="uppercase text-[9px] font-black">Status Estratégico</Label>
                          <Select value={formState.statusManual} onValueChange={(val) => setFormState({...formState, statusManual: val as any})}>
                            <SelectTrigger className="border-black font-black uppercase h-11 text-[10px] rounded-none">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              <SelectItem value="Automatico" className="font-black uppercase text-[10px]">Automático (Prazo)</SelectItem>
                              <SelectItem value="Caso Crítico" className="font-black uppercase text-[10px]">Caso Crítico</SelectItem>
                              <SelectItem value="Atenção" className="font-black uppercase text-[10px]">Atenção</SelectItem>
                              <SelectItem value="Encerrado" className="font-black uppercase text-[10px]">Encerrado</SelectItem>
                              <SelectItem value="Arquivado" className="font-black uppercase text-[10px]">Arquivado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1">
                          <Label className="uppercase text-[9px] font-black">Prazo (DD/MM/AAAA)</Label>
                          <Input value={formState.proximoPrazo} onChange={(e) => setFormState({...formState, proximoPrazo: e.target.value})} className="border-black font-black rounded-none h-11" />
                        </div>
                      </div>
                      <div className="grid gap-1">
                        <Label className="uppercase text-[9px] font-black">Notas Estratégicas</Label>
                        <Textarea value={formState.observacao} onChange={(e) => setFormState({...formState, observacao: e.target.value})} className="border-black font-black uppercase text-[10px] min-h-[80px] rounded-none" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full font-black text-white bg-black hover:bg-white hover:text-black border-2 border-black uppercase h-12 transition-all rounded-none shadow-[4px_4px_0px_#00D1FF]">
                        Sincronizar Gabinete
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="ghost" size="icon" onClick={loadData} className="h-10 w-10 text-black border-2 border-black rounded-none bg-white">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 lg:p-8 overflow-hidden min-h-0">
          <div className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-3 lg:p-4 border-b-2 border-black bg-[#f8f9fb] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input 
                  placeholder="BUSCAR CLIENTE OU PROTOCOLO..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-black border-2 h-10 text-[10px] lg:text-[11px] font-black text-black uppercase bg-white rounded-none focus-visible:ring-0"
                />
              </div>
              <Badge className="bg-black text-white border-none font-black text-[9px] lg:text-[10px] uppercase px-4 h-10 flex items-center justify-center rounded-none shrink-0">
                {filtered.length} REGISTROS ATIVOS
              </Badge>
            </div>

            <div className="flex-1 overflow-auto min-h-0 bg-white">
              {filtered.length > 0 ? (
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead className="sticky top-0 bg-[#f3f2f2] z-20 border-b-2 border-black shadow-sm">
                    <tr className="text-[9px] lg:text-[10px] uppercase font-black text-black/40 tracking-widest">
                      <th className="px-6 py-5">Conta / Protocolo</th>
                      <th className="px-6 py-5">Tribunal</th>
                      <th className="px-6 py-5">Advogado</th>
                      <th className="px-6 py-5">Status / Prazo</th>
                      <th className="px-6 py-5">Último Contato</th>
                      <th className="px-6 py-5 text-right">Ações de Gabinete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/5 bg-white">
                    {filtered.map((c) => (
                      <CaseRow 
                        key={c.id} 
                        c={c} 
                        isOperador={isOperador} 
                        onLogReturn={handleLogReturn} 
                        onEdit={handleEditClick} 
                        onDelete={handleDeleteCase}
                        onShowObs={onShowObs}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <EmptyState 
                    icon={Briefcase} 
                    title={loading ? "Sincronizando..." : "Nenhum processo encontrado"} 
                    description={loading ? "Carregando registros da nuvem W1 Capital." : "A base de dados atual está vazia ou não condiz com sua busca."}
                    actionLabel={!loading && isOperador ? "Adicionar Primeiro Caso" : undefined}
                    onAction={() => setIsModalOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[8px] lg:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital
          </div>
          <span className="hidden sm:inline text-black">Relatório Consolidado • DAVI ALVES FIGUEREDO</span>
        </footer>

        <Dialog open={!!obsDialogOpen} onOpenChange={(open) => !open && setObsDialogOpen(null)}>
          <DialogContent className="bg-white border-2 border-black text-black rounded-none sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-black uppercase flex items-center gap-2">
                <Info size={18} /> Nota de Gabinete
              </DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <p className="text-xs lg:text-sm font-black uppercase leading-relaxed text-black whitespace-pre-wrap italic bg-gray-50 p-4 border-2 border-dashed border-black/20">
                {obsDialogOpen}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setObsDialogOpen(null)} className="w-full font-black text-white bg-black hover:bg-white hover:text-black border-2 border-black uppercase h-11 transition-all rounded-none">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: any }) {
  const styles: Record<string, { bg: string, icon: React.ReactNode }> = {
    'Vencido': { bg: "bg-red-600 text-white", icon: <AlertTriangle size={10} /> },
    'É Hoje': { bg: "bg-blue-600 text-white font-black animate-pulse", icon: <Clock size={10} /> },
    'Caso Crítico': { bg: "bg-red-600 text-white", icon: <AlertTriangle size={10} /> },
    'Atenção': { bg: "bg-orange-500 text-white", icon: <AlertTriangle size={10} /> },
    'No Prazo': { bg: "bg-green-600 text-white", icon: <CheckCircle size={10} /> },
    'Arquivado': { bg: "bg-black text-white", icon: <Briefcase size={10} /> },
    'Encerrado': { bg: "bg-gray-800 text-white", icon: <CheckCircle size={10} /> },
    'Sem Prazo': { bg: "bg-gray-400 text-white", icon: <Info size={10} /> },
  };

  const config = styles[status] || styles['Sem Prazo'];

  return (
    <Badge className={cn("px-2 py-0.5 font-black text-[8px] lg:text-[9px] uppercase border-none shadow-sm rounded-none flex items-center gap-1.5 w-fit", config.bg)}>
      {config.icon}
      {status}
    </Badge>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-black font-black uppercase">Sincronizando...</div>}>
      <CasesContent />
    </Suspense>
  );
}
