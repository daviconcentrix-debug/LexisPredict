import { supabase, isSupabaseConfigured } from './supabase';
import { LegalCase, CaseNote } from './case-logic';
import DOMPurify from 'isomorphic-dompurify';

/**
 * MOTOR DE BUSCA AVANÇADO E PERSISTÊNCIA RELACIONAL
 * Implementa sanitização contra XSS e isolamento via Supabase
 */

export async function getStoredCases(searchTerm?: string): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase.from('processos').select('*');

    if (searchTerm) {
      query = query.or(`cliente.ilike.%${searchTerm}%,protocolo.ilike.%${searchTerm}%,advogado.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    return data ? data.map(item => ({
      id: item.id,
      cliente: item.cliente,
      protocolo: item.protocolo,
      advogado: item.advogado,
      situacao: item.situacao,
      proximoPrazo: item.proximo_prazo,
      tribunal: item.tribunal,
      status: item.status as any,
      diasFaltando: item.dias_faltando,
      linkConsulta: item.link_consulta,
      tipo: item.tipo,
      telefone: item.telefone,
      atendente: item.atendente,
      scoreIA: item.score_ia,
      riscoIA: item.risco_ia,
      parecerIA: item.parecer_ia,
      ultimoRetorno: item.ultimo_retorno
    })) : [];
  } catch (error) {
    console.error('Supabase fetch failed:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Cloud not configured." };
  try {
    const dbCases = cases.map(c => ({
      cliente: c.cliente,
      protocolo: c.protocolo,
      advogado: c.advogado,
      situacao: c.situacao,
      proximo_prazo: c.proximoPrazo,
      tribunal: c.tribunal,
      status: c.status,
      dias_faltando: c.diasFaltando,
      link_consulta: c.linkConsulta,
      tipo: c.tipo,
      telefone: c.telefone,
      atendente: c.atendente,
      score_ia: c.scoreIA,
      risco_ia: c.riscoIA,
      parecer_ia: DOMPurify.sanitize(c.parecerIA || ''),
      ultimo_retorno: c.ultimoRetorno
    }));

    // No modo MVP, limpamos e reinserimos para garantir sincronia.
    // Em produção real usaríamos upsert por protocolo.
    await supabase.from('processos').delete().neq('protocolo', '___VOID___');

    if (dbCases.length > 0) {
      const { error: insertError } = await supabase.from('processos').insert(dbCases);
      if (insertError) throw insertError;
    }

    return { success: true, message: "Cloud database updated." };
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return { success: false, message: "Sync failed." };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data ? data.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      color: 'bg-sidebar/40',
      updatedAt: new Date(item.created_at).toLocaleString('pt-BR')
    })) : [];
  } catch (error) {
    console.error('Supabase notes fetch failed:', error);
    return [];
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured) return { success: false };
  try {
    const cleanNotes = notes.map(n => ({
      title: DOMPurify.sanitize(n.title),
      content: DOMPurify.sanitize(n.content)
    }));

    // Limpa para sincronia completa do array (estratégia MVP)
    await supabase.from('notes').delete().neq('title', '___VOID___');
    
    if (cleanNotes.length === 0) return { success: true };
    
    const { error } = await supabase.from('notes').insert(cleanNotes);
    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error saving notes:', error);
    return { success: false };
  }
}
