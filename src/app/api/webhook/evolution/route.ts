/**
 * @fileOverview Webhook de Recebimento de Mensagens Evolution API v1.0
 * Captura mensagens via Webhook e persiste no Supabase.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://segjskjlbeydlljnefai.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Verificação de evento Evolution API
    if (payload.event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ status: 'ignored', event: payload.event });
    }

    const data = payload.data;
    if (!data || !data.message) {
      return NextResponse.json({ status: 'no_data' });
    }

    // 1. Extração de Identificadores
    const instanceName = payload.instance || 'Lexis';
    const messageId = data.key?.id || '';
    const fromMe = data.key?.fromMe || false;
    const remoteJid = data.key?.remoteJid || '';
    const contactNumber = remoteJid.split('@')[0];
    const contactName = data.pushName || 'WhatsApp Contact';
    
    // 2. Extração de Texto (Resiliente a múltiplos formatos)
    const message = data.message;
    let messageText = '';

    if (message.conversation) {
      messageText = message.conversation;
    } else if (message.extendedTextMessage?.text) {
      messageText = message.extendedTextMessage.text;
    } else if (message.imageMessage?.caption) {
      messageText = message.imageMessage.caption;
    } else if (message.videoMessage?.caption) {
      messageText = message.videoMessage.caption;
    } else if (message.buttonsResponseMessage?.selectedDisplayText) {
      messageText = message.buttonsResponseMessage.selectedDisplayText;
    } else if (message.templateButtonReplyMessage?.selectedDisplayText) {
      messageText = message.templateButtonReplyMessage.selectedDisplayText;
    }

    // 3. Conversão de Timestamp (Unix para ISO)
    const timestamp = data.messageTimestamp 
      ? new Date(data.messageTimestamp * 1000).toISOString() 
      : new Date().toISOString();

    // 4. Persistência no Supabase
    // Nota: O campo empresa_id pode ser nulo se não houver mapeamento de instância por empresa
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        instance_name: instanceName,
        contact_number: contactNumber,
        contact_name: contactName,
        message_id: messageId,
        message_text: messageText,
        from_me: fromMe,
        timestamp: timestamp,
        raw_payload: payload
      });

    if (error) {
      console.error('[Webhook Error] Supabase Insert:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error('[Webhook Error] Critical Failure:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
