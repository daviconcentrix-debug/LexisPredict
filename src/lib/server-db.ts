
import { supabase, isSupabaseConfigured } from './supabase';
import { LegalCase, CaseNote } from './case-logic';

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('processos')
      .select('dados');

    if (error) throw error;
    return data ? data.map(item => item.dados as LegalCase) : [];
  } catch (error) {
    console.error('Supabase fetch failed:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Cloud not configured." };
  try {
    // Delete all current records to refresh from master list
    const { error: deleteError } = await supabase.from('processos').delete().neq('id', -1);
    if (deleteError) throw deleteError;

    if (cases.length === 0) {
      return { success: true, message: "Database cleared." };
    }

    const { error: insertError } = await supabase
      .from('processos')
      .insert(cases.map(c => ({ dados: c })));

    if (insertError) throw insertError;

    return { success: true, message: "Cloud database updated." };
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return { success: false, message: "Sync failed. Check connection." };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  if (!isSupabaseConfigured) return [];
  try {
    // Try both schemas: 'dados' column or flat columns
    const { data, error } = await supabase
      .from('notes')
      .select('*');

    if (error) throw error;
    
    return data ? data.map(item => {
      if (item.dados) return item.dados as CaseNote;
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        color: item.color || 'bg-sidebar/40',
        updatedAt: item.updated_at || item.created_at
      } as CaseNote;
    }) : [];
  } catch (error) {
    console.error('Supabase notes fetch failed:', error);
    return [];
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured) return { success: false };
  try {
    // Clear existing notes in cloud
    await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000' as any);
    
    if (notes.length === 0) return { success: true };
    
    // Save with both patterns for maximum compatibility
    const { error } = await supabase
      .from('notes')
      .insert(notes.map(n => ({ 
        id: n.id,
        title: n.title,
        content: n.content,
        dados: n 
      })));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving notes to Supabase:', error);
    return { success: false };
  }
}
