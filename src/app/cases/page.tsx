
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
  FileText
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
    statusManual: 'Atenção' as any,
    observacao: ''
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
      ADVOGADO: formState.advogado,
      'PRÓXIMO PRAZO': formState.proximoPrazo,
      SITUAÇÃO: formState.situacao,
      ULTIMO_RETORNO: formState.ultimoRetorno,
      STATUS_MANUAL: formState.statusManual,
      OBSERVACAO: formState.observacao
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
      setFormState({ 
        cliente: '', 
        protocolo: '', 
        advogado: '', 
        proximoPrazo: '', 
        situacao: 'EM ANDAMENTO', 
        ultimoRetorno: '',
        statusManual: 'Atenção',
        observacao: ''
      });
      toast({ title: editingCase ? "Caso Atualizado" : "Caso Adicionado", description: "Sincronizado com sucesso." });
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
      statusManual: c.statusManual || 'Atenção',
      observacao: c.observacao || ''
    });
    setIsModalOpen(true);
  };

  const deleteCase = async (id: string) => {
    if (!isOperador) return;
    if (confirm('Tem certeza que deseja excluir este caso?')) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      await syncRepoCases(updated);
      toast({ title: "Caso Excluído", description: "Base cloud atualizada." });
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
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white/90 backdrop-blur-sm flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default tracking-tighter">
              {isAdmin ? "Visão Global de Processos" : "Meus Processos Ativos"}
            </h1>
            <Badge variant="outline" className="text-black font-black border-black border-2 px-3 py-1 flex items-center gap-1.5 uppercase text-[10px]">
              <ShieldCheck size={10} /> {isAdmin ? 'Nível Administrador' : 'Nível Operador'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {isOperador && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black border-2 border-black hover:bg-black hover:text-white font-black h-9 uppercase text-[10px] px-6 transition-all shadow-[4px_4px_0px_#000] hover:shadow-none">
                    <Plus className="w-3.5 h-3.5 mr-2" /> Novo Processo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-2 border-black text-black sm:max-w-[425px]">
                  <form onSubmit={handleSaveCase}>
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase text-black">Registro de Caso</DialogTitle>
                      <DialogDescription className="font-bold text-black/60 uppercase text-[9px]">Insira os detalhes procedurais no seu silo.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="font-black text-black text-[10px] uppercase">NOME DO CLIENTE</Label>
                        <Input id="name" value={formState.cliente} onChange={(e) => setFormState({...formState, cliente: e.target.value})} className="border-black text-black font-black uppercase" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="protocol" className="font-black text-black text-[10px] uppercase">PROTOCOLO CNJ</Label>
                        <Input id="protocol" placeholder="0000000-00.2025.8.00.0000" value={formState.protocolo} onChange={(e) => setFormState({...formState, protocolo: e.target.value})} className="border-black text-black font-black" disabled={!!editingCase} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="status_manual" className="font-black text-black text-[10px] uppercase">STATUS DO CASO</Label>
                          <Select value={formState.statusManual} onValueChange={(val) => setFormState({...formState, statusManual: val as any})}>
                            <SelectTrigger className="border-black font-black uppercase h-10 text-[10px]">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black">
                              <SelectItem value="Caso Crítico" className="font-black uppercase text-[10px]">Caso Crítico</SelectItem>
                              <SelectItem value="Atenção" className="font-black uppercase text-[10px]">Atenção</SelectItem>
                              <SelectItem value="Encerrado" className="font-black uppercase text-[10px]">Encerrado</SelectItem>
                              <SelectItem value="Arquivado" className="font-black uppercase text-[10px]">Arquivado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deadline" className="font-black text-black text-[10px] uppercase">PRAZO (DD/MM/AAAA)</Label>
                          <Input id="deadline" placeholder="30/12/2026" value={formState.proximoPrazo} onChange={(e) => setFormState({...formState, proximoPrazo: e.target.value})} className="border-black text-black font-black" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="obs" className="font-black text-black text-[10px] uppercase">OBSERVAÇÕES ESTRATÉGICAS</Label>
                        <Textarea id="obs" value={formState.observacao} onChange={(e) => setFormState({...formState, observacao: e.target.value})} className="border-black text-black font-black uppercase text-[10px] min-h-[80px]" placeholder="NOTAS ADICIONAIS..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full font-black text-white bg-black hover:bg-white hover:text-black border-2 border-black uppercase h-11 transition-all">Sincronizar Dados</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            
            <Button variant="ghost" size="sm" onClick={loadData} className="h-9 text-black font-black hover:bg-black hover:text-white border-2 border-black transition-all uppercase text-[10px] px-6 bg-white">
              <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} /> Sincronizar
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md border-2 border-black rounded-none shadow-[8px_8px_0px_#000] flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb] flex items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input 
                  placeholder="BUSCAR CLIENTE, PROTOCOLO OU ADVOGADO..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-black h-10 text-[11px] font-black focus-visible:ring-0 text-black uppercase bg-white"
                />
              </div>
              <Badge className="bg-black text-white border-none font-black text-[10px] uppercase px-3 h-10 flex items-center rounded-none tracking-widest">
                {filtered.length} REGISTROS
              </Badge>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 bg-[#f3f2f2] z-10 border-b-2 border-black">
                  <tr className="text-[10px] uppercase font-black text-black/40 tracking-widest">
                    <th className="px-6 py-4">Conta / Cliente / Protocolo</th>
                    <th className="px-6 py-4">Tribunal Público</th>
                    <th className="px-6 py-4">Responsável Técnico</th>
                    <th className="px-6 py-4">Status / Prazo</th>
                    <th className="px-6 py-4">Último Contato</th>
                    <th className="px-6 py-4 text-right">Ações de Gabinete</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/5">
                  {filtered.length > 0 ? filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-black group transition-all cursor-default">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-black font-black text-sm group-hover:text-white transition-colors uppercase leading-none">{c.cliente}</span>
                          <span className="text-[10px] font-mono text-black/60 group-hover:text-white/60 mt-1 uppercase">{c.protocolo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className="bg-white border-black border-2 font-black text-[9px] text-black group-hover:bg-white group-hover:text-black uppercase">
                          {c.tribunal}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-[11px] text-black font-black uppercase group-hover:text-white transition-colors">
                        {c.advogado}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={c.statusManual || c.status} />
                          <p className="text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase">{c.proximoPrazo || 'Sem Prazo'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-black/40 group-hover:text-white/40" />
                          <span className="text-[11px] text-black group-hover:text-white font-black uppercase">
                            {c.ultimoRetorno || 'S/ Registro'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.observacao && (
                            <Button variant="ghost" size="icon" className="text-black group-hover:text-white" title={c.observacao}>
                              <FileText size={16} />
                            </Button>
                          )}
                          {isOperador && (
                            <>
                              <Button 
                                title="Registrar Retorno Hoje"
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleLogReturn(c.protocolo)} 
                                className="text-black group-hover:text-white hover:bg-black transition-all"
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button title="Editar Registro" variant="ghost" size="icon" onClick={() => handleEditClick(c)} className="text-black group-hover:text-white hover:bg-black transition-all">
                                <Edit2 size={16} />
                              </Button>
                            </>
                          )}
                          <Button title="Consultar no Tribunal" variant="ghost" size="icon" asChild className="text-black group-hover:text-white hover:bg-black transition-all">
                            <a href={c.linkConsulta} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={16} />
                            </a>
                          </Button>
                          {isOperador && (
                            <Button title="Excluir Registro" variant="ghost" size="icon" onClick={() => deleteCase(c.id)} className="text-black group-hover:text-red-500 hover:bg-black transition-all">
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-32 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                          <div className="w-16 h-16 bg-[#f3f2f2] rounded-none flex items-center justify-center mx-auto border-2 border-black shadow-[4px_4px_0px_#000]">
                            <Briefcase className="text-black" size={32} />
                          </div>
                          <h3 className="text-black font-black uppercase tracking-tight">Nenhum Registro Localizado</h3>
                          <p className="text-[10px] text-black/60 font-black uppercase leading-relaxed tracking-widest">Base de dados vazia ou filtro de visão ativo para sua conta.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white/90 backdrop-blur-sm flex items-center justify-center gap-6 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital
          </div>
          <span className="w-1 h-1 bg-muted-foreground rounded-full opacity-30" />
          <span className="text-black font-black uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: any }) {
  const styles: Record<string, string> = {
    'Vencido': "bg-red-600 text-white",
    'Caso Crítico': "bg-red-600 text-white",
    'Atenção': "bg-orange-500 text-white",
    'No Prazo': "bg-green-600 text-white",
    'Arquivado': "bg-black text-white",
    'Encerrado': "bg-gray-800 text-white",
    'Sem Prazo': "bg-gray-400 text-white",
  };

  return (
    <Badge className={cn("px-2 py-0.5 font-black text-[9px] uppercase border-none shadow-sm transition-all group-hover:scale-110 rounded-none", styles[status] || "bg-gray-400 text-white")}>
      {status}
    </Badge>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-black font-black uppercase">Sincronizando Gabinete...</div>}>
      <CasesContent />
    </Suspense>
  );
}
