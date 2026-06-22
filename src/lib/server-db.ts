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
    // Overwrite-style sync for simplified CRM logic
    await supabase.from('notes').delete().not('id', 'is', null);
    
    if (notes.length === 0) return { success: true };
    
    const { error } = await supabase
      .from('notes')
      .insert(notes.map(n => ({ 
        title: n.title,
        content: n.content
      })));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving notes to Supabase:', error);
    return { success: false };
  }
}
