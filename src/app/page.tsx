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

export default function Dashboard() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Puxa direto os dados nativos do repositório (os mesmos que alimentavam o app antes)
      const repoData = await fetchRepoCases();
      
      if (Array.isArray(repoData) && repoData.length > 0) {
        setCases(repoData);
      } else {
        console.warn("fetchRepoCases não retornou um array válido ou veio vazio.");
      }
    } catch (err) {
      console.error('Erro ao carregar dados locais:', err);
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
    const processed = cases.filter(c => c.status === 'No Prazo' || c.status === 'Atenção').length;
    const riskScore = total ? Math.round(((critical + attention) / total) * 100) : 0;

    return { total, critical, attention, processed, riskScore };
  }, [cases]);

  const urgentQueue = useMemo(() => {
    return cases
      .filter(c => c.status === 'Vencido' || c.status === 'Atenção')
      .sort((a, b) => {
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search cases..." 
                className="pl-10 h-9 bg-secondary border-none text-xs rounded-full focus-visible:ring-primary text-white"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap
