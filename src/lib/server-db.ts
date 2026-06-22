
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
    // Standard "Clear All" logic using a broad filter
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
    const { data, error } = await supabase
      .from('notes')
      .select('dados');

    if (error) throw error;
    return data ? data.map(item => item.dados as CaseNote) : [];
  } catch {
    return [];
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured) return { success: false };
  try {
    await supabase.from('notes').delete().neq('id', -1);
    if (notes.length === 0) return { success: true };
    
    const { error } = await supabase
      .from('notes')
      .insert(notes.map(n => ({ dados: n })));

    return { success: !error };
  } catch {
    return { success: false };
  }
}
