
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  CheckCircle, 
  RefreshCcw, 
  Phone, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Search,
  ExternalLink,
  MessageCircle,
  Copyright,
  CalendarDays,
  Target,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Settings2,
  Plus,
  Minus,
  Zap,
  UserCheck,
  CheckCircle2,
  Loader2,
  FileText,
  Calendar
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases, syncRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface TaskGroup {
  cliente: string;
  vencidos: number;
  hoje: number;
  totalAtivos: number;
  diasAtrasoMax: number;
  protocoloReferencia: string;
  telefone: string;
  cases: LegalCase[];
}

export default function TarefasPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dailyMeta, setDailyMeta] = useState(25);
  const [contatadosHoje, setContatadosHoje] = useState<string[]>([]);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showContacted, setShowContacted] = useState(false);
  
  // Estado do Atendimento
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [activeGroup, setActiveGroup] = useState<TaskGroup | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    observacao: '',
    proximoRetorno: '',
    applyToAll: true
  });

  const { toast } = useToast();

  const getTodayKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `lexis_tarefas_contatados_${today}`;
  };

  useEffect(() => {
    const savedMeta = localStorage.getItem('lexis_tarefas_meta');
    if (savedMeta) {
      const parsed = parseInt(savedMeta);
      if (!isNaN(parsed)) setDailyMeta(parsed);
    }

    const savedContatados = localStorage.getItem(getTodayKey());
    if (savedContatados) {
      try {
        setContatadosHoje(JSON.parse(savedContatados));
      } catch (e) {
        setContatadosHoje([]);
      }
    }
  }, []);

  const adjustMeta = (amount: number) => {
    const newVal = Math.max(10, Math.min(50, dailyMeta + amount));
    setDailyMeta(newVal);
    localStorage.setItem('lexis_tarefas_meta', newVal.toString());
    toast({ title: `Meta atualizada: ${newVal} contatos`, duration: 1500 });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRepoCases();
      if (Array.isArray(data)) setCases(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const taskData = useMemo(() => {
    const groups: Record<string, TaskGroup> = {};
    const contactedSet = new Set(contatadosHoje);

    const activeCases = cases.filter(c => 
      !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())
    );

    activeCases.forEach(c => {
      // Regra de entrada na fila: Vencido ou É Hoje
      if (c.status !== 'Vencido' && c.status !== 'É Hoje') return;

      const nome = c.cliente || 'NÃO IDENTIFICADO';
      if (!groups[nome]) {
        groups[nome] = {
          cliente: nome,
          vencidos: 0,
          hoje: 0,
          totalAtivos: 0,
          diasAtrasoMax: 0,
          protocoloReferencia: c.protocolo,
          telefone: c.telefone || '',
          cases: []
        };
      }

      groups[nome].totalAtivos++;
      groups[nome].cases.push(c);
      
      if (c.status === 'Vencido') {
        groups[nome].vencidos++;
        const atraso = c.diasFaltando ? Math.abs(c.diasFaltando) : 0;
        if (atraso > groups[nome].diasAtrasoMax) {
          groups[nome].diasAtrasoMax = atraso;
        }
      }
      
      if (c.status === 'É Hoje') {
        groups[nome].hoje++;
      }
    });

    const sortedAll = Object.values(groups)
      .filter(g => g.cliente.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (b.diasAtrasoMax !== a.diasAtrasoMax) return b.diasAtrasoMax - a.diasAtrasoMax;
        if (b.vencidos !== a.vencidos) return b.vencidos - a.vencidos;
        return b.totalAtivos - a.totalAtivos;
      });

    const pending = sortedAll.filter(g => !contactedSet.has(g.cliente));
    const done = sortedAll.filter(g => contactedSet.has(g.cliente));

    return {
      focus: pending.slice(0, dailyMeta),
      backlog: pending.slice(dailyMeta),
      completed: done,
      totalPendingCount: pending.length
    };
  }, [cases, search, contatadosHoje, dailyMeta]);

  const openAttendance = (group: TaskGroup) => {
    setActiveGroup(group);
    setAttendanceForm({
      observacao: '',
      proximoRetorno: '',
      applyToAll: true
    });
    setIsAttendanceOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!activeGroup || isSavingAttendance) return;
    setIsSavingAttendance(true);

    try {
      const today = format(new Date(), 'dd/MM/yyyy');
      const savedThreshold = localStorage.getItem('lexisPredict_urgency_alert');
      const thresholds = { alertLimit: savedThreshold ? parseInt(savedThreshold) : 3 };

      const updatedCases = cases.map(c => {
        const isMatch = attendanceForm.applyToAll 
          ? c.cliente === activeGroup.cliente 
          : activeGroup.cases.some(ac => ac.protocolo === c.protocolo);

        if (isMatch) {
          // Atualiza dados de atendimento
          const newCaseData = {
            ...c,
            ultimoRetorno: today,
            observacao: attendanceForm.observacao || c.observacao,
            proximoPrazo: attendanceForm.proximoRetorno || c.proximoPrazo,
            statusManual: 'Automatico' // Garante que o motor recalcule o status com a nova data
          };

          // Rodar processarCaso para garantir que status e diasFaltando sejam recalculados
          return processarCaso(newCaseData, thresholds);
        }
        return c;
      });

      const result = await syncRepoCases(updatedCases);
      
      if (result.success) {
        setCases(updatedCases);
        
        // Atualiza localStorage diário
        const updatedContatados = [...contatadosHoje, activeGroup.cliente];
        setContatadosHoje(updatedContatados);
        localStorage.setItem(getTodayKey(), JSON.stringify(updatedContatados));

        setIsAttendanceOpen(false);
        setActiveGroup(null);
        toast({ title: "Atendimento Sincronizado", description: `Dados gravados com sucesso para ${activeGroup.cliente}.` });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Falha na Gravação", description: error.message || "Erro ao salvar no servidor.", variant: "destructive" });
    } finally {
      setIsSavingAttendance(false);
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-black text-white rounded-lg shadow-lg">
              <CheckCircle size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-black text-xl text-foreground uppercase tracking-tight">Tarefas de Contato</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Execução e Metas do Dia</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={loadData} className="h-10 w-10 rounded-xl hover:bg-secondary">
              <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin text-primary")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 max-w-[1400px] mx-auto w-full space-y-10 pb-32">
          {!loading && (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-slate-400 bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Aguardando Fila</p>
                <h3 className="text-3xl font-black tracking-tighter text-foreground">{taskData.totalPendingCount}</h3>
              </div>
              
              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-primary bg-white shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                   <Settings2 size={60} />
                </div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Meta Diária</p>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black tracking-tighter text-foreground tabular-nums">{dailyMeta}</span>
                  <div className="flex items-center gap-1.5 ml-auto relative z-10">
                    <Button variant="outline" size="icon" onClick={() => adjustMeta(-5)} className="h-8 w-8 rounded-lg border-border hover:bg-secondary hover:text-primary"><Minus size={14} /></Button>
                    <Button variant="outline" size="icon" onClick={() => adjustMeta(5)} className="h-8 w-8 rounded-lg border-border hover:bg-secondary hover:text-primary"><Plus size={14} /></Button>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-emerald-500 bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Contatados Hoje</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tracking-tighter text-emerald-600">{contatadosHoje.length}</h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">unid.</span>
                </div>
              </div>

              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-orange-400 bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Faltam p/ Meta</p>
                <h3 className="text-3xl font-black tracking-tighter text-orange-600">{Math.max(0, dailyMeta - contatadosHoje.length)}</h3>
              </div>
            </section>
          )}

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Pesquisar por titular na fila..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 bg-white border border-border/50 rounded-xl text-xs font-bold uppercase focus-visible:ring-primary/20 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-4 py-2 rounded-lg">
                <AlertCircle size={14} className="text-primary" />
                <span>Registrar o contato atualiza a data de retorno no banco de dados.</span>
              </div>
            </div>

            {/* LISTA DE FOCO */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Target size={18} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Foco Prioritário do Dia</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {taskData.focus.length > 0 ? (
                  taskData.focus.map((group) => (
                    <TaskCard key={group.cliente} group={group} isFocus onMarkContacted={() => openAttendance(group)} />
                  ))
                ) : (
                  <div className="col-span-full py-20 flex items-center justify-center">
                    <EmptyState 
                      icon={contatadosHoje.length >= dailyMeta ? CheckCircle2 : CheckCircle} 
                      title={contatadosHoje.length >= dailyMeta ? "Meta Batida!" : "Fila Limpa"} 
                      description={contatadosHoje.length >= dailyMeta ? "Você atingiu sua meta diária de atendimentos." : "Nenhum contato pendente nesta lista."}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* LISTA DE BACKLOG */}
            {taskData.backlog.length > 0 && (
              <div className="pt-10 space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowBacklog(!showBacklog)}
                  className="w-full flex items-center justify-between p-6 h-auto bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Restante da Fila Crítica</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{taskData.backlog.length} contatos aguardando fora da meta</p>
                    </div>
                  </div>
                  {showBacklog ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </Button>

                {showBacklog && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                    {taskData.backlog.map((group) => (
                      <TaskCard key={group.cliente} group={group} onMarkContacted={() => openAttendance(group)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LISTA DE CONTATADOS HOJE */}
            {taskData.completed.length > 0 && (
              <div className="pt-10 space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowContacted(!showContacted)}
                  className="w-full flex items-center justify-between p-6 h-auto bg-emerald-50/50 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck size={18} className="text-emerald-500" />
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Contatados Hoje</h3>
                      <p className="text-[10px] font-bold text-emerald-600/60 uppercase">{taskData.completed.length} atendimentos concluídos</p>
                    </div>
                  </div>
                  {showContacted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </Button>

                {showContacted && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                    {taskData.completed.map((group) => (
                      <div key={group.cliente} className="p-4 bg-white border border-emerald-100 rounded-xl flex items-center gap-3 shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                           <CheckCircle2 size={16} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase truncate text-slate-700">{group.cliente}</p>
                            <p className="text-[9px] font-bold text-emerald-600/40 uppercase">Sincronizado</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="h-10 border-t border-border/50 bg-card/60 flex items-center justify-center gap-6 text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.4em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span>Operações Prioritárias • Davi Alves Figueredo</span>
        </footer>

        {/* MODAL DE ATENDIMENTO */}
        <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
          <DialogContent className="sm:max-w-[480px] rounded-2xl border-none shadow-2xl overflow-hidden p-0">
            <DialogHeader className="p-6 bg-secondary/20 border-b">
              <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
                <UserCheck className="text-primary" /> Registrar Atendimento
              </DialogTitle>
              <DialogDescription className="font-bold uppercase text-[10px] text-muted-foreground">
                Cliente: {activeGroup?.cliente}
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="uppercase text-[9px] font-black text-muted-foreground flex items-center gap-2">
                    <Calendar size={12} /> Data do Próximo Retorno
                  </Label>
                  <Input 
                    placeholder="DD/MM/AAAA"
                    value={attendanceForm.proximoRetorno}
                    onChange={(e) => setAttendanceForm({...attendanceForm, proximoRetorno: e.target.value})}
                    className="rounded-xl h-12 bg-secondary/30 border-none font-bold text-sm"
                  />
                  <p className="text-[8px] font-black uppercase text-muted-foreground/60">Ao definir uma nova data, o processo sairá da fila de tarefas atual.</p>
                </div>
                
                <div className="grid gap-2">
                  <Label className="uppercase text-[9px] font-black text-muted-foreground flex items-center gap-2">
                    <FileText size={12} /> Observações de Gabinete
                  </Label>
                  <Textarea 
                    placeholder="DETALHES DO QUE FOI TRATADO COM O CLIENTE..."
                    value={attendanceForm.observacao}
                    onChange={(e) => setAttendanceForm({...attendanceForm, observacao: e.target.value.toUpperCase()})}
                    className="rounded-xl min-h-[120px] bg-secondary/30 border-none font-bold text-[11px] uppercase resize-none"
                  />
                </div>

                <div className="flex items-center space-x-3 bg-secondary/20 p-4 rounded-xl border border-border/10">
                  <Checkbox 
                    id="apply-all" 
                    checked={attendanceForm.applyToAll}
                    onCheckedChange={(val) => setAttendanceForm({...attendanceForm, applyToAll: !!val})}
                  />
                  <Label htmlFor="apply-all" className="text-[10px] font-black uppercase cursor-pointer leading-tight">
                    Aplicar a todos os {activeGroup?.cases.length} processos deste cliente
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 pt-0 bg-white">
              <Button 
                onClick={handleSaveAttendance} 
                disabled={isSavingAttendance}
                className="w-full h-14 bg-black text-white hover:bg-black/90 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all"
              >
                {isSavingAttendance ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 text-primary" />}
                {isSavingAttendance ? "Sincronizando Banco..." : "Finalizar & Agendar Retorno"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function TaskCard({ group, isFocus = false, onMarkContacted }: { group: TaskGroup, isFocus?: boolean, onMarkContacted: () => void }) {
  return (
    <div className={cn(
      "premium-card p-6 bg-white border border-border/40 hover:border-primary/40 transition-all group flex flex-col",
      isFocus && "shadow-md ring-1 ring-primary/5"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
          isFocus ? "bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white" : "bg-slate-50 text-slate-400"
        )}>
          <Phone size={24} />
        </div>
        <div className="flex flex-col items-end gap-2">
          {group.vencidos > 0 ? (
            <Badge className="bg-red-50 text-red-700 border-none text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
              <ShieldAlert size={10} /> {group.vencidos} Vencido{group.vencidos > 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
              <Clock size={10} /> Prazo Hoje
            </Badge>
          )}
          {group.diasAtrasoMax > 0 && (
            <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter animate-pulse">
              Há {group.diasAtrasoMax} dia{group.diasAtrasoMax > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 flex-1">
        <h3 className="font-black text-sm text-foreground uppercase tracking-tight group-hover:text-primary transition-colors truncate">{group.cliente}</h3>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <CalendarDays size={12} className="opacity-40" />
          <span>Ref: {group.protocoloReferencia}</span>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Ações de Contato</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg text-emerald-600 hover:bg-emerald-50">
              <a href={formatWhatsAppLink(group.telefone)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} />
              </a>
            </Button>
            <Button 
              title="Registrar atendimento no banco" 
              variant="ghost" 
              size="icon" 
              onClick={onMarkContacted}
              className="h-9 w-9 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <UserCheck size={18} />
            </Button>
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-50">
              <Link href={`/cases?search=${encodeURIComponent(group.cliente)}`}>
                <ExternalLink size={18} />
              </Link>
            </Button>
          </div>
        </div>
        <Button variant="ghost" asChild className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/5 transition-all">
          <Link href={`/cases?search=${encodeURIComponent(group.cliente)}`}>
            Ver Perfil <ChevronRight size={14} className="ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
