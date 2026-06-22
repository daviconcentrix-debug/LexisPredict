"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { Briefcase, ShieldAlert, TrendingUp, Search, ChevronRight, Scale, Database } from 'lucide-react';
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
      // 1. Tenta buscar via Server Action
      const repoData = await fetchRepoCases();
      
      if (Array.isArray(repoData) && repoData.length > 0) {
        setCases(repoData);
        return;
      }

      // 2. Fallback: Se o servidor retornar vazio, tenta buscar o JSON estático diretamente
      const response = await fetch('/data/cases.json');
      if (response.ok) {
        const jsonData = await response.json();
        setCases(jsonData);
      } else {
        console.error("Não foi possível carregar o arquivo de dados.");
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    total: cases.length,
    critical: cases.filter(c => c.status === 'Vencido').length,
    attention: cases.filter(c => c.status === 'Atenção').length,
    processed: cases.filter(c => c.status === 'No Prazo' || c.status === 'Atenção').length,
    riskScore: cases.length ? Math.round(((cases.filter(c => c.status === 'Vencido' || c.status === 'Atenção').length) / cases.length) * 100) : 0
  };

  const urgentQueue = cases
    .filter(c => c.status === 'Vencido' || c.status === 'Atenção')
    .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
    .slice(0, 5);

  return (
    <div className="flex h-screen bg-background text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-8">
          <h1 className="font-bold text-xl">Intelligence Unit</h1>
          <Input placeholder="Search cases..." className="w-64 bg-secondary border-none text-xs rounded-full" />
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total de Processos" value={stats.total} icon={<Briefcase size={20} />} />
            <StatCard title="Alertas Críticos" value={stats.critical} icon={<ShieldAlert size={20} />} color="destructive" />
            <StatCard title="Taxa de Risco" value={`${stats.riskScore}%`} icon={<TrendingUp size={20} />} color="accent" />
            <StatCard title="Ativos" value={stats.processed} icon={<Scale size={20} />} color="success" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <section className="xl:col-span-2 bg-card border border-border rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg">Priority Queue</h2>
                <Button variant="ghost" size="sm" onClick={loadData}>Refresh</Button>
              </div>

              {loading ? <p>Loading data...</p> : urgentQueue.length > 0 ? (
                <div className="space-y-3">
                  {urgentQueue.map((c) => (
                    <div key={c.protocolo} className="p-4 bg-secondary/30 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{c.cliente}</p>
                        <p className="text-[10px] text-muted-foreground">{c.protocolo}</p>
                      </div>
                      <Badge className={c.status === 'Vencido' ? 'bg-destructive/20' : 'bg-accent/20'}>
                        {c.diasFaltando}d
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No pending items.</p>}
            </section>

            <section className="bg-gradient-to-br from-primary to-accent rounded-2xl p-8 flex flex-col justify-center">
              <Database className="w-8 h-8 mb-4" />
              <h2 className="text-2xl font-bold">Repository Status</h2>
              <p className="text-sm mt-2">Database is {cases.length > 0 ? 'Online' : 'Offline'}.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
