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
  Clock, 
  Copyright, 
  ShieldCheck, 
  FileText, 
  MessageCircle, 
  Info,
  Lock,
  Loader2
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { fetchRepoCases, syncRepoCases, deleteCaseSecureAction } from '@/app/actions/case-actions';
import { format } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

function CasesContent() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [obsDialogOpen, setObsDialogOpen] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  
  // Segurança
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperador) return;
    
    if (!formState.cliente || !formState.protocolo) {
      toast({ title: "Erro de Validação", description: "Nome e Protocolo são obrigatórios.", variant: "destructive" });
      return;
    }

    const processed = processarCaso({
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
    });

    const updated = editingCase 
      ? cases.map(c => c.id === editingCase.id ? { ...processed, id: editingCase.id } : c)
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
  };

  const handleLogReturn = async (protocolo: string) => {
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
  };

  const handleEditClick = (c: LegalCase) => {
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
  };

  const executeSecureDelete = async () => {
    if (!deleteId || !deletePassword) return;
    setIsDeleting(true);

    const result = await deleteCaseSecureAction(deleteId, deletePassword);
    
    if (result.success) {
      setCases(cases.filter(c => c.protocolo !== deleteId));
      setDeleteId(null);
      setDeletePassword('');
      toast({ title: "Operação Concluída", description: "O registro foi movido para o arquivo de segurança." });
    } else {
      toast({ title: "Falha na Autorização", description: result.message, variant: "destructive" });
    }
    setIsDeleting(false);
  };

  const filtered = useMemo(() => {
    return cases.filter(c => 
      (c.cliente || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.protocolo || '').includes(search) ||
      (c.advogado && c.advogado.toLowerCase().includes(search.toLowerCase()))
    );
  }, [cases, search]);

  return (
    <div className="flex h-screen bg-background font-sans text-foreground relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 lg:h-16 border-b border-border bg-card flex items-center justify-between px-6 lg:px-8 shrink-0 z-40">
          <div className="flex items-center gap-4 pl-10 lg:pl-0">
            <h1 className="font-black text-lg lg:text-xl text-foreground uppercase tracking-tight truncate max-w-[150px] lg:max-w-none">
              Gestão de Processos
            </h1>
            <Badge variant="outline" className="hidden sm:flex text-foreground font-black border-border border-2 px-3 py-1 items-center gap-1.5 uppercase text-[9px] lg:text-[10px]">
              <ShieldCheck size={10} className="text-primary" /> {isAdmin ? 'Admin' : 'Operador'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {isOperador && (
              <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setEditingCase(null); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCase(null)} className="bg-primary text-primary-foreground font-black h-9 lg:h-10 uppercase text-[9px] lg:text-[10px] px-3 lg:px-6 transition-all rounded-none whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5 mr-2" /> Novo Registro
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-2 border-border text-foreground sm:max-w-[425px] rounded-none max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleSaveCase}>
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase text-foreground">Registro de Gabinete</DialogTitle>
                      <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground">Insira os dados técnicos do novo processo.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-1">
                        <Label className="uppercase text-[9px] font-black">Identificação do Cliente</Label>
                        <Input value={formState.cliente} onChange={(e) => setFormState({...formState, cliente: e.target.value})} className="border-border font-black uppercase rounded-none h-11 bg-background" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="uppercase text-[9px] font-black">Protocolo CNJ</Label>
                        <Input value={formState.protocolo} onChange={(e) => setFormState({...formState, protocolo: e.target.value})} className="border-border font-black rounded-none h-11 bg-background" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1">
                           <Label className="uppercase text-[9px] font-black">Advogado</Label>
                           <Input value={formState.advogado} onChange={(e) => setFormState({...formState, advogado: e.target.value})} className="border-border font-black uppercase rounded-none h-11 bg-background" />
                        </div>
                        <div className="grid gap-1">
                           <Label className="uppercase text-[9px] font-black">WhatsApp</Label>
                           <Input value={formState.telefone} onChange={(e) => setFormState({...formState, telefone: e.target.value})} className="border-border font-black uppercase rounded-none h-11 bg-background" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1">
                          <Label className="uppercase text-[9px] font-black">Status Estratégico</Label>
                          <Select value={formState.statusManual} onValueChange={(val) => setFormState({...formState, statusManual: val as any})}>
                            <SelectTrigger className="border-border font-black uppercase h-11 text-[10px] rounded-none bg-background">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-2 border-border rounded-none">
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
                          <Input value={formState.proximoPrazo} onChange={(e) => setFormState({...formState, proximoPrazo: e.target.value})} className="border-border font-black rounded-none h-11 bg-background" />
                        </div>
                      </div>
                      <div className="grid gap-1">
                        <Label className="uppercase text-[9px] font-black">Notas Estratégicas</Label>
                        <Textarea value={formState.observacao} onChange={(e) => setFormState({...formState, observacao: e.target.value})} className="border-border font-black uppercase text-[10px] min-h-[80px] rounded-none bg-background" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full font-black bg-primary text-primary-foreground border-2 border-primary uppercase h-12 transition-all rounded-none">Sincronizar Dados</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="ghost" size="icon" onClick={loadData} className="h-9 w-9 lg:h-10 lg:w-10 text-foreground border-2 border-border rounded-none bg-card hover:bg-primary hover:text-primary-foreground transition-all">
              <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 lg:p-8 overflow-hidden min-h-0">
          <div className="bg-card border-2 border-border rounded-none shadow-lg flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-3 lg:p-4 border-b-2 border-border bg-muted/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="FILTRAR POR CLIENTE OU CNJ..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-border h-10 text-[10px] lg:text-[11px] font-black focus-visible:ring-0 text-foreground uppercase bg-background rounded-none"
                />
              </div>
              <Badge className="bg-primary text-primary-foreground border-none font-black text-[9px] lg:text-[10px] uppercase px-3 h-10 flex items-center justify-center rounded-none tracking-widest shrink-0">
                {filtered.length} REGISTROS ATIVOS
              </Badge>
            </div>

            <div className="flex-1 overflow-auto min-h-0 min-w-0 bg-background" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-md z-20 border-b-2 border-border">
                  <tr className="text-[9px] lg:text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    <th className="px-6 py-4">Titular / Protocolo</th>
                    <th className="px-6 py-4">Tribunal</th>
                    <th className="px-6 py-4">Advogado</th>
                    <th className="px-6 py-4">Status / Prazo</th>
                    <th className="px-6 py-4">Último Retorno</th>
                    <th className="px-6 py-4 text-right">Comandos</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border/10">
                  {filtered.length > 0 ? filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-all cursor-default">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-foreground font-black text-xs lg:text-sm uppercase leading-none">{c.cliente}</span>
                          <span className="text-[9px] lg:text-[10px] font-mono text-muted-foreground mt-1 uppercase">{c.protocolo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className="bg-card border-border border-2 font-black text-[8px] lg:text-[9px] text-foreground uppercase rounded-none">
                          {c.tribunal}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-[10px] lg:text-[11px] text-foreground font-black uppercase">
                        {c.advogado}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={c.status} />
                          <p className="text-[9px] lg:text-[10px] text-muted-foreground font-black uppercase">{c.proximoPrazo || 'Sem Prazo'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-[10px] lg:text-[11px] text-foreground font-black uppercase whitespace-nowrap">
                            {c.ultimoRetorno || 'S/ Registro'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.telefone && (
                             <Button title="WhatsApp" variant="ghost" size="icon" asChild className="text-green-600 hover:bg-green-600 hover:text-white transition-all h-8 w-8">
                               <a href={formatWhatsAppLink(c.telefone)} target="_blank" rel="noopener noreferrer">
                                 <MessageCircle size={16} />
                               </a>
                             </Button>
                          )}
                          {c.observacao && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-foreground hover:bg-primary hover:text-primary-foreground h-8 w-8" 
                              onClick={() => setObsDialogOpen(c.observacao || null)}
                            >
                              <FileText size={16} />
                            </Button>
                          )}
                          {isOperador && (
                            <>
                              <Button 
                                title="Log Retorno"
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleLogReturn(c.protocolo)} 
                                className="text-foreground hover:bg-primary hover:text-primary-foreground transition-all h-8 w-8"
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button title="Editar" variant="ghost" size="icon" onClick={() => handleEditClick(c)} className="text-foreground hover:bg-primary hover:text-primary-foreground transition-all h-8 w-8">
                                <Edit2 size={16} />
                              </Button>
                            </>
                          )}
                          <Button title="Ver Tribunal" variant="ghost" size="icon" asChild className="text-foreground hover:bg-primary hover:text-primary-foreground transition-all h-8 w-8">
                            <a href={c.linkConsulta} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={16} />
                            </a>
                          </Button>
                          {isOperador && (
                            <Button title="Excluir" variant="ghost" size="icon" onClick={() => setDeleteId(c.protocolo)} className="text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all h-8 w-8">
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-24 lg:py-32 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                          <div className="w-16 h-16 bg-muted/50 rounded-none flex items-center justify-center mx-auto border-2 border-border shadow-md">
                            <Briefcase className="text-muted-foreground" size={32} />
                          </div>
                          <h3 className="text-foreground font-black uppercase tracking-tight">Vazio Operacional</h3>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-border bg-card flex items-center justify-center gap-4 lg:gap-6 text-[8px] lg:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital
          </div>
          <span className="hidden sm:inline uppercase">Relatório Consolidado • DAVI ALVES FIGUEREDO</span>
        </footer>

        {/* DIALOG: NOTA DE GABINETE */}
        <Dialog open={!!obsDialogOpen} onOpenChange={(open) => !open && setObsDialogOpen(null)}>
          <DialogContent className="bg-card border-2 border-border text-foreground rounded-none sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-black uppercase flex items-center gap-2">
                <Info size={18} className="text-primary" /> Nota de Gabinete
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground">Detalhes estratégicos registrados para este processo.</DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <p className="text-xs lg:text-sm font-black uppercase leading-relaxed text-foreground whitespace-pre-wrap italic bg-muted/30 p-4 border-2 border-dashed border-border/50">
                {obsDialogOpen}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setObsDialogOpen(null)} className="w-full font-black bg-primary text-primary-foreground border-2 border-primary uppercase h-11 transition-all rounded-none">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG: EXCLUSÃO SEGURA (SENHA) */}
        <Dialog open={!!deleteId} onOpenChange={(open) => { if(!open) { setDeleteId(null); setDeletePassword(''); }}}>
          <DialogContent className="bg-card border-2 border-border text-foreground rounded-none sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-black uppercase flex items-center gap-2 text-destructive">
                <Lock size={18} /> Autorização de Exclusão
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground">Esta operação é crítica e requer validação de autoridade.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <p className="text-[11px] font-black uppercase text-foreground/70 leading-relaxed">
                Para confirmar o arquivamento definitivo do processo <span className="text-foreground border-b-2 border-primary">{deleteId}</span>, insira sua senha de acesso ao gabinete:
              </p>
              <Input 
                type="password" 
                placeholder="SENHA DE OPERAÇÃO..." 
                value={deletePassword} 
                onChange={(e) => setDeletePassword(e.target.value)} 
                className="border-2 border-border font-black uppercase h-12 rounded-none bg-background focus-visible:ring-primary"
              />
            </div>
            <DialogFooter className="sm:justify-between gap-3">
              <Button variant="ghost" onClick={() => setDeleteId(null)} className="font-black uppercase text-[10px] border-2 border-border rounded-none h-11">Cancelar</Button>
              <Button 
                onClick={executeSecureDelete} 
                disabled={!deletePassword || isDeleting}
                className="flex-1 font-black bg-destructive text-destructive-foreground border-2 border-destructive uppercase h-11 rounded-none shadow-[4px_4px_0px_#000]"
              >
                {isDeleting ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {isDeleting ? "Validando..." : "Confirmar Exclusão"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: any }) {
  const styles: Record<string, string> = {
    'Vencido': "bg-red-600 text-white",
    'É Hoje': "bg-blue-600 text-white font-black animate-pulse",
    'Caso Crítico': "bg-red-600 text-white",
    'Atenção': "bg-orange-500 text-white",
    'No Prazo': "bg-green-600 text-white",
    'Arquivado': "bg-muted text-muted-foreground border-2 border-border",
    'Encerrado': "bg-gray-800 text-white",
    'Sem Prazo': "bg-gray-400 text-white",
  };

  return (
    <Badge className={cn("px-2 py-0.5 font-black text-[8px] lg:text-[9px] uppercase border-none shadow-sm transition-all group-hover:scale-110 rounded-none", styles[status] || "bg-gray-400 text-white")}>
      {status}
    </Badge>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-foreground font-black uppercase">Sincronizando Gabinete...</div>}>
      <CasesContent />
    </Suspense>
  );
}
