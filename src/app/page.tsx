"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  TrendingUp,
  Database,
  Search,
  ArrowUpRight,
  ChevronRight,
  Scale
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Tenta buscar os dados globais direto na nuvem do Supabase
      const { data: cloudRows, error } = await supabase
        .from('processos')
        .select('dados');

      // 2. Carrega SEMPRE os dados do repositório/servidor como fonte principal ou backup estável
      const repoData = await fetchRepoCases();
      const validRepoData = Array.isArray(repoData) ? repoData : [];

      if (!error && cloudRows && cloudRows.length > 0) {
        // Se já existem dados na nuvem, usamos eles
        const cloudCases = cloudRows.map((item: any) => item.dados as LegalCase);
        setCases(cloudCases);
      } else {
        // Se a nuvem estiver vazia ou der erro, usamos os dados do repositório que alimentam a outra aba
        setCases(validRepoData);
        
        // Se a nuvem estava vazia mas temos dados locais, alimenta o Supabase para sincronizar as máquinas
        if (validRepoData.length > 0 && !cloudRows?.length) {
          const rowsToInsert = validRepoData.map(c => ({ dados: c }));
          await supabase.from('processos').insert(rowsToInsert);
        }
      }
    } catch (err) {
      console.error('Erro geral na sincronização:', err);
      // Fallback definitivo para garantir que a tela nunca fique zerada se houver dados no sistema
      const repoData = await fetchRepoCases();
      if (Array.isArray(repoData)) setCases(repoData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = cases.length;
    const critical = cases.filter(c => c.status === 'Vencido').length;
    const attention = cases.filter(c => c.status === 'Atenção').length;
    
    // Filtra os que estão em andamento com base no seu padrão visual
    const processed = cases.filter(c => c.status === 'No Prazo' || c.status === 'Atenção').length;
    
    // Cálculo da taxa de risco baseado nos alertas críticos e atenção
    const riskScore = total ? Math.round(((critical + attention) / total) * 100) : 0;

    return { total, critical, attention, processed, riskScore };
  }, [cases]);

  const urgentQueue = useMemo(() => {
    return cases
      .filter(c => c.status === 'Vencido' || c.status === 'Atenção')
      .sort((a, b) => {
        // Coloca os Vencidos primeiro, depois ordena por data/dias restantes
        if (a.status === 'Vencido' && b.status !== 'Vencido') return -1;
        if (a.status !== 'Vencido' && b.status === 'Vencido') return 1;
        return (a.diasFaltando || 0) - (b.diasFaltando || 0);
      })
      .slice(0, 5);
  }, [cases]);

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Intelligence Unit</h1>
            <Badge variant="outline" className="border-primary/50 text-primary text-[10px] uppercase font-bold tracking-tighter">Shared Repository</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4
