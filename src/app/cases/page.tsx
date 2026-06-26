
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
  Lock
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

function CasesContent() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const { isAdmin } = useAdmin();
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
    if (!isAdmin) return;
    
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
      toast({ title: editingCase ? "Caso Atualizado" : "Caso Adicionado", description: "Sincronizado com sucesso." });
    }
  };

  const handleLogReturn = async (protocolo: string) => {
    if (!isAdmin) return;
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
    if (!isAdmin) return;
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
    if (!isAdmin) return;
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
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Gestão de Processos</h1>
            <Badge variant="outline" className="text-black font-black border-black">{filtered.length} registros ativos</Badge>
            {!isAdmin && (
              <Badge variant="secondary" className="bg-[#e2e2e2] text-[10px] text-black font-black uppercase flex items-center gap-1.5 border border-black">
                <Lock size={10} /> MODO VISITANTE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-gray-800 font-black h-8 text-white uppercase text-xs px-6">
                    <Plus className="w-3.5 h-3.5 mr-2" /> Novo Processo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-black text-black sm:max-w-[425px]">
                  <form onSubmit={handleSaveCase}>
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase">Registro de Caso</DialogTitle>
                      <DialogDescription className="font-bold text-black/60">Insira os detalhes procedurais.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="font-black">NOME DO CLIENTE</Label>
                        <Input id="name" value={formState.cliente} onChange={(e) => setFormState({...formState, cliente: e.target.value})} className="border-black text-black" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="protocol" className="font-black">PROTOCOLO CNJ</Label>
                        <Input id="protocol" placeholder="0000000-00.2025.8.00.0000" value={formState.protocolo} onChange={(e) => setFormState({...formState, protocolo: e.target.value})} className="border-black text-black" disabled={!!editingCase} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="attorney" className="font-black">ADVOGADO</Label>
                          <Input id="attorney" value={formState.advogado} onChange={(e) => setFormState({...formState, advogado: e.target.value})} className="border-black text-black" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deadline" className="font-black">PRAZO (DD/MM/AAAA)</Label>
                          <Input id="deadline" placeholder="30/12/2026" value={formState.proximoPrazo} onChange={(e) => setFormState({...formState, proximoPrazo: e.target.value})} className="border-black text-black" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full font-black text-white bg-black hover:bg-gray-800 uppercase">Sincronizar Dados</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            
            <Button variant="ghost" size="sm" onClick={loadData} className="h-8 text-black font-black hover:bg-black hover:text-white border border-black transition-all">
              <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} /> Sincronizar
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="bg-white border border-[#dddbda] rounded shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#dddbda] bg-[#f8f9fb] flex items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input 
                  placeholder="Buscar nome, protocolo ou advogado..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-black h-10 text-sm focus-visible:ring-black text-black"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 bg-[#f3f2f2] z-10">
                  <tr className="border-b border-[#dddbda] text-[10px] uppercase font-black text-black/40 tracking-widest">
                    <th className="px-6 py-4">Cliente / Protocolo</th>
                    <th className="px-6 py-4">Tribunal</th>
                    <th className="px-6 py-4">Advogado Responsável</th>
                    <th className="px-6 py-4">Status Procedural</th>
                    <th className="px-6 py-4">Último Retorno</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dddbda]">
                  {filtered.length > 0 ? filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-black group transition-all cursor-default">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-black font-black text-sm group-hover:text-white transition-colors uppercase">{c.cliente}</span>
                          <span className="text-xs font-mono text-black/60 group-hover:text-white/60 mt-0.5">{c.protocolo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className="bg-[#f8f9fb] border-black font-black text-[10px] text-black group-hover:bg-white group-hover:text-black">
                          {c.tribunal}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-sm text-black font-black uppercase group-hover:text-white transition-colors">
                        {c.advogado}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={c.status} />
                          <p className="text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase">{c.proximoPrazo || 'Sem Prazo'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-black/40 group-hover:text-white/40" />
                          <span className="text-xs text-black group-hover:text-white font-black uppercase">
                            {c.ultimoRetorno || 'S/ Registro'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleLogReturn(c.protocolo)} 
                                className="text-black group-hover:text-white hover:bg-black"
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(c)} className="text-black group-hover:text-white hover:bg-black">
                                <Edit2 size={16} />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" asChild className="text-black group-hover:text-white hover:bg-black">
                            <a href={c.linkConsulta} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={16} />
                            </a>
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => deleteCase(c.id)} className="text-black group-hover:text-red-500 hover:bg-black">
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="max-w-xs mx-auto space-y-3">
                          <div className="w-12 h-12 bg-[#e2e2e2] rounded-full flex items-center justify-center mx-auto border border-black">
                            <Briefcase className="text-black" />
                          </div>
                          <h3 className="text-black font-black uppercase">Nenhum Registro Localizado</h3>
                          <p className="text-sm text-black/60 font-bold uppercase">Base de dados vazia ou sem resultados.</p>
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
    'Vencido': "bg-red-600 text-white",
    'Atenção': "bg-orange-500 text-white",
    'No Prazo': "bg-green-600 text-white",
    'Arquivado': "bg-gray-400 text-white",
    'Sem Prazo': "bg-gray-400 text-white",
  };

  return (
    <Badge className={cn("px-2 py-0.5 font-black text-[10px] uppercase border-none shadow-sm transition-all group-hover:scale-110", styles[status])}>
      {status}
    </Badge>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-black font-black uppercase">Carregando Auditoria...</div>}>
      <CasesContent />
    </Suspense>
  );
}
