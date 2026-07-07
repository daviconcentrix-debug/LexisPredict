
'use server';

import { supabase, isSupabaseConfigured, UserProfile } from './supabase';
import { LegalCase, CaseNote } from './case-logic';
import { cookies } from 'next/headers';

/**
 * MOTOR DE PERSISTÊNCIA RELACIONAL LEXISPREDICT (SUPABASE SaaS v270.0 ELITE)
 * Operações baseadas em contexto de sessão e isolamento de perfil.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */

async function getUserContext(): Promise<{ id: string | null; empresa_id: string | null; cargo: string | null; email: string | null; auth_id: string | null }> {
  const cookieStore = await cookies();
  const userEmailCookie = cookieStore.get('lexis_user_email')?.value;
  const masterEmailCookie = cookieStore.get('lexis_master_email')?.value;
  
  const emailToLookup = masterEmailCookie || userEmailCookie;
  
  if (!emailToLookup) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { id: null, empresa_id: null, cargo: null, email: null, auth_id: null };
  }

  const email = emailToLookup;

  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, empresa_id, cargo, email, auth_user_id')
    .eq('email', email?.toLowerCase().trim())
    .maybeSingle();
    
  return { 
    id: profile?.id || null,
    auth_id: profile?.auth_user_id || null,
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
  const { auth_id, empresa_id, cargo } = await getUserContext();
  
  if (!auth_id && !isMaster) return [];

  try {
    let query = supabase.from('processos').select('dados, created_by');

    if (!isMaster) {
      if (!empresa_id) return [];
      query = query.eq('empresa_id', empresa_id);
      
      // ISOLAMENTO: Operadores veem apenas seus próprios casos. Admins veem tudo da empresa.
      if (cargo !== 'Administrador') {
        query = query.eq('created_by', auth_id);
      }
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
  const { auth_id, empresa_id } = await getUserContext();
  
  if (!empresa_id || !auth_id) {
    return { success: false, message: "Sessão expirada." };
  }

  try {
    const uniqueMap = new Map();
    cases.forEach(c => { if(c && c.protocolo) uniqueMap.set(c.protocolo, c); });
    const uniqueCases = Array.from(uniqueMap.values());

    // Deleta apenas os registros deste usuário específico para evitar wipe na empresa
    await supabase.from('processos').delete().eq('created_by', auth_id);
    
    if (uniqueCases.length > 0) {
      const payload = uniqueCases.map(c => ({ 
        dados: c, 
        empresa_id: empresa_id, 
        created_by: auth_id
      }));
      
      const { error: insertError } = await supabase.from('processos').insert(payload);
      if (insertError) throw insertError;
    }
    
    return { success: true, message: "Sincronizado." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getStoredNotes(): Promise<CaseNote[]> {
  if (!isSupabaseConfigured) return [];
  
  const isMaster = await isMasterAuthorized();
  const { auth_id, empresa_id, cargo } = await getUserContext();
  if (!auth_id && !isMaster) return [];

  try {
    let query = supabase.from('notes').select('*');

    if (!isMaster) {
      if (!empresa_id) return [];
      query = query.eq('empresa_id', empresa_id);
      
      if (cargo !== 'Administrador') {
        query = query.eq('created_by', auth_id);
      }
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
        title: item.title || 'Nota',
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
  const { auth_id, empresa_id } = await getUserContext();
  if (!empresa_id || !auth_id) return { success: false };

  try {
    await supabase.from('notes').delete().eq('created_by', auth_id);
    
    if (notes && notes.length > 0) {
      const dbNotes = notes.map(n => ({
        title: n.title || 'Nota',
        content: n.imageUrl ? JSON.stringify({ text: n.content, imageUrl: n.imageUrl }) : n.content,
        empresa_id: empresa_id,
        created_by: auth_id
      }));
      
      await supabase.from('notes').insert(dbNotes);
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
