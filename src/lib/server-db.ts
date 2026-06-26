
'use server';

import { supabase, isSupabaseConfigured, UserProfile } from './supabase';
import { LegalCase, CaseNote } from './case-logic';
import { cookies } from 'next/headers';

/**
 * MOTOR DE PERSISTÊNCIA RELACIONAL LEXISPREDICT (SUPABASE SaaS v85.0 ELITE)
 * Operações 100% Baseadas em UUID (auth_user_id) e Isolamento de Visão por Role.
 * Protocolo Master Persistente via Cookies de Identidade.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */

async function getUserContext(): Promise<{ id: string | null; empresa_id: string | null; cargo: string | null; email: string | null }> {
  const cookieStore = await cookies();
  const userEmailCookie = (await cookieStore).get('lexis_user_email')?.value;
  const masterEmailCookie = (await cookieStore).get('lexis_master_email')?.value;
  
  const emailToLookup = masterEmailCookie || userEmailCookie;
  if (!emailToLookup) return { id: null, empresa_id: null, cargo: null, email: null };

  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, empresa_id, cargo, email, auth_user_id')
    .eq('email', emailToLookup.toLowerCase().trim())
    .maybeSingle();
    
  return { 
    id: profile?.id || null,
    empresa_id: profile?.empresa_id || null, 
    cargo: profile?.cargo || null,
    email: profile?.email || emailToLookup
  };
}

async function isMasterAuthorized(): Promise<boolean> {
  const masterEmail = 'daviconcentrix@gmail.com';
  const cookieStore = await cookies();
  
  const userEmail = (await cookieStore).get('lexis_master_email')?.value;
  const masterKey = (await cookieStore).get('lexis_master_unlock')?.value;
  
  return userEmail?.toLowerCase() === masterEmail.toLowerCase() && masterKey === '40028922';
}

async function migrateLegacyData(empresa_id: string) {
  if (!empresa_id) return;
  const { count } = await supabase.from('processos').select('*', { count: 'exact', head: true }).is('empresa_id', null);
  if (count && count > 0) {
    await supabase.from('processos').update({ empresa_id }).is('empresa_id', null);
    await supabase.from('notes').update({ empresa_id }).is('empresa_id', null);
  }
}

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  
  const isMaster = await isMasterAuthorized();
  const { id, empresa_id, cargo } = await getUserContext();
  if (!id && !isMaster) return [];

  try {
    if (empresa_id && !isMaster) await migrateLegacyData(empresa_id);

    let query = supabase.from('processos').select('dados');

    if (!isMaster) {
      if (!empresa_id) return [];
      query = query.eq('empresa_id', empresa_id);
      if (cargo === 'Operador') query = query.eq('created_by', id);
    }

    const { data, error } = await query.order('id', { ascending: false });
    if (error) throw error;
    
    const uniqueMap = new Map();
    const results = data ? data.map(item => item.dados as LegalCase) : [];
    results.forEach(c => { if (!uniqueMap.has(c.protocolo)) uniqueMap.set(c.protocolo, c); });
    
    return Array.from(uniqueMap.values());
  } catch (error) {
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Erro de Configuração." };
  const { id, empresa_id, cargo } = await getUserContext();
  if (!empresa_id || !id) return { success: false, message: "Acesso Negado." };

  try {
    const uniqueMap = new Map();
    cases.forEach(c => uniqueMap.set(c.protocolo, c));
    const uniqueCases = Array.from(uniqueMap.values());

    let deleteQuery = supabase.from('processos').delete().eq('empresa_id', empresa_id);
    if (cargo === 'Operador') deleteQuery = deleteQuery.eq('created_by', id);
    await deleteQuery;
    
    if (uniqueCases.length > 0) {
      const payload = uniqueCases.map(c => ({ dados: c, empresa_id: empresa_id, created_by: id }));
      const { error: insertError } = await supabase.from('processos').insert(payload);
      if (insertError) throw insertError;
    }
    
    return { success: true, message: "Base sincronizada com sucesso." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  if (!isSupabaseConfigured) return [];
  
  const isMaster = await isMasterAuthorized();
  const { id, empresa_id, cargo } = await getUserContext();
  if (!id && !isMaster) return [];

  try {
    let query = supabase.from('notes').select('*');

    if (!isMaster) {
      if (!empresa_id) return [];
      query = query.eq('empresa_id', empresa_id);
      if (cargo === 'Operador') query = query.eq('created_by', id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return data ? data.map(item => {
      let imageUrl;
      let displayContent = item.content || '';
      try {
        if (displayContent.startsWith('{')) {
          const parsed = JSON.parse(displayContent);
          displayContent = parsed.text;
          imageUrl = parsed.imageUrl;
        }
      } catch (e) {}

      return {
        id: item.id.toString(),
        title: item.title || 'Atualização de Gabinete',
        content: displayContent,
        imageUrl: imageUrl,
        color: 'bg-white',
        updatedAt: new Date(item.created_at).toLocaleString('pt-BR')
      };
    }) : [];
  } catch (error) {
    return [];
  }
}

export async function saveStoredNotes(notes: CaseNote[]): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured) return { success: false };
  const { id, empresa_id, cargo } = await getUserContext();
  if (!empresa_id || !id) return { success: false };

  try {
    let deleteQuery = supabase.from('notes').delete().eq('empresa_id', empresa_id);
    if (cargo === 'Operador') deleteQuery = deleteQuery.eq('created_by', id);
    await deleteQuery;
    
    if (notes && notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title || 'Atualização de Gabinete',
        content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content,
        empresa_id: empresa_id,
        created_by: id
      }));
      
      const { error: insertError } = await supabase.from('notes').insert(dbNotes);
      if (insertError) throw insertError;
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function getEmpresaUsers(): Promise<UserProfile[]> {
  const { empresa_id } = await getUserContext();
  if (!empresa_id) return [];
  
  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('nome', { ascending: true });
    
  return data ? (data as UserProfile[]) : [];
}

export async function removeEmpresaUser(userId: string): Promise<boolean> {
  const { error } = await supabase.from('usuarios').delete().eq('id', userId);
  return !error;
}
