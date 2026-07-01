
'use server';

import { supabase, isSupabaseConfigured, UserProfile } from './supabase';
import { LegalCase, CaseNote } from './case-logic';
import { cookies } from 'next/headers';

/**
 * MOTOR DE PERSISTÊNCIA RELACIONAL LEXISPREDICT (SUPABASE SaaS v145.0 ELITE)
 * Operações baseadas em contexto de sessão e cookies de identidade.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */

async function getUserContext(): Promise<{ id: string | null; empresa_id: string | null; cargo: string | null; email: string | null }> {
  const cookieStore = await cookies();
  const userEmailCookie = cookieStore.get('lexis_user_email')?.value;
  const masterEmailCookie = cookieStore.get('lexis_master_email')?.value;
  
  const emailToLookup = masterEmailCookie || userEmailCookie;
  
  // Tenta obter a sessão diretamente do Supabase se o cookie falhar ou para validar
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!emailToLookup && !session?.user) {
    return { id: null, empresa_id: null, cargo: null, email: null };
  }

  const email = emailToLookup || session?.user?.email;

  // Busca perfil completo
  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, empresa_id, cargo, email, auth_user_id')
    .eq('email', email?.toLowerCase().trim())
    .maybeSingle();
    
  return { 
    id: profile?.auth_user_id || session?.user?.id || profile?.id || null,
    empresa_id: profile?.empresa_id || null, 
    cargo: profile?.cargo || 'Operador',
    email: email || null
  };
}

async function isMasterAuthorized(): Promise<boolean> {
  const masterEmail = 'daviconcentrix@gmail.com';
  const cookieStore = await cookies();
  
  const userEmail = cookieStore.get('lexis_master_email')?.value;
  const masterKey = cookieStore.get('lexis_master_unlock')?.value;
  
  return userEmail?.toLowerCase() === masterEmail.toLowerCase() && masterKey === '40028922';
}

export async function getStoredCases(): Promise<LegalCase[]> {
  if (!isSupabaseConfigured) return [];
  
  const isMaster = await isMasterAuthorized();
  const { id, empresa_id } = await getUserContext();
  
  if (!id && !isMaster) return [];

  try {
    let query = supabase.from('processos').select('dados');

    if (!isMaster) {
      if (!empresa_id) return [];
      // Filtra por empresa para garantir que Davi e sua equipe vejam os dados do seu silo
      query = query.eq('empresa_id', empresa_id);
    }

    const { data, error } = await query.order('id', { ascending: false });
    if (error) throw error;
    
    const uniqueMap = new Map();
    const results = data ? data.map(item => item.dados as LegalCase) : [];
    
    results.forEach(c => { 
      if (c && c.protocolo && !uniqueMap.has(c.protocolo)) {
        uniqueMap.set(c.protocolo, c);
      }
    });
    
    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error('Fetch Error:', error);
    return [];
  }
}

export async function saveStoredCases(cases: LegalCase[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) return { success: false, message: "Erro de Configuração." };
  const { id, empresa_id } = await getUserContext();
  
  if (!empresa_id || !id) {
    return { success: false, message: "Sessão de Gabinete expirada. Por favor, faça login novamente." };
  }

  try {
    const uniqueMap = new Map();
    cases.forEach(c => { if(c && c.protocolo) uniqueMap.set(c.protocolo, c); });
    const uniqueCases = Array.from(uniqueMap.values());

    // Limpeza por tenant para evitar duplicidade
    const { error: deleteError } = await supabase.from('processos').delete().eq('empresa_id', empresa_id);
    if (deleteError) throw deleteError;
    
    if (uniqueCases.length > 0) {
      const payload = uniqueCases.map(c => ({ 
        dados: c, 
        empresa_id: empresa_id, 
        created_by: id
      }));
      
      const { error: insertError } = await supabase.from('processos').insert(payload);
      if (insertError) throw insertError;
    }
    
    return { success: true, message: "Base de dados sincronizada com sucesso." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  if (!isSupabaseConfigured) return [];
  
  const isMaster = await isMasterAuthorized();
  const { id, empresa_id } = await getUserContext();
  if (!id && !isMaster) return [];

  try {
    let query = supabase.from('notes').select('*');

    if (!isMaster) {
      if (!empresa_id) return [];
      query = query.eq('empresa_id', empresa_id);
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
  const { id, empresa_id } = await getUserContext();
  if (!empresa_id || !id) return { success: false };

  try {
    await supabase.from('notes').delete().eq('empresa_id', empresa_id);
    
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
