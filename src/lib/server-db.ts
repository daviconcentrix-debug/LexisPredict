
import { supabase } from './supabase';
import { LegalCase } from './case-logic';

export async function getStoredCases(): Promise<LegalCase[]> {
  try {
    const { data, error } = await supabase
      .from('processos')
      .select('dados');

    if (error) {
      console.warn('Supabase fetch failed, trying local fallback:', error);
      return [];
    }

    return data ? data.map(item => item.dados as LegalCase) : [];
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Delete all existing records
    const { error: deleteError } = await supabase.from('processos').delete().neq('id', -1);
    if (deleteError) throw deleteError;

    if (cases.length === 0) {
      return { success: true, message: "Database cleared." };
    }

    // 2. Batch insert new records
    const { error: insertError } = await supabase
      .from('processos')
      .insert(cases.map(c => ({ dados: c })));

    if (insertError) throw insertError;

    return { success: true, message: "Cloud database updated." };
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return { success: false, message: "Sync failed. Check Supabase connection." };
  }
}
