
import { supabase, isSupabaseConfigured } from './supabase';
import { LegalCase, CaseNote } from './case-logic';

/**
 * MOTOR DE PERSISTÊNCIA RELACIONAL LEXISPREDICT (SUPABASE)
 * Implementação resiliente via UPSERT e sanitização nativa.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */

function sanitizeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/on\w+="[^"]*"/gim, "")
    .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
    .trim();
}

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('processos')
      .select('dados')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(item => item.dados as LegalCase) : [];
  } catch (error) {
    console.error('Supabase fetch processes error:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Supabase não configurado." };
  try {
    // Para cada caso, realizamos a lógica de UPSERT baseada no protocolo dentro do JSONB
    // Já que a coluna 'id' no banco é bigint (sequencial)
    for (const c of cases) {
      // 1. Verificar se o processo já existe pelo protocolo no JSONB
      const { data: existing } = await supabase
        .from('processos')
        .select('id')
        .contains('dados', { protocolo: c.protocolo })
        .maybeSingle();

      if (existing) {
        // 2. Se existe, atualiza apenas o JSONB
        await supabase
          .from('processos')
          .update({ dados: c })
          .eq('id', existing.id);
      } else {
        // 3. Se não existe, insere novo
        await supabase
          .from('processos')
          .insert([{ dados: c }]);
      }
    }
    return { success: true, message: "Nuvem Sincronizada com W1 Capital." };
  } catch (error: any) {
    console.error('Supabase save processes error:', error);
    return { success: false, message: error.message };
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
    console.error('Supabase fetch notes error:', error);
    return [];
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured) return { success: false };
  try {
    // Sincronização inteligente das notas via DELETE/INSERT (Keep mode)
    const { error: deleteError } = await supabase.from('notes').delete().neq('title', '___KEEP_ALIVE___');
    if (deleteError) throw deleteError;
    
    if (notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: sanitizeHtml(n.title || 'Sem Título'),
        content: sanitizeHtml(n.content || '')
      }));
      
      const { error: insertError } = await supabase.from('notes').insert(dbNotes);
      if (insertError) throw insertError;
    }
    return { success: true };
  } catch (error) {
    console.error('Supabase save notes error:', error);
    return { success: false };
  }
}
