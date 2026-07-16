/**
 * @fileOverview Webhook Evolution API → Supabase v2100.0 ELITE
 * Sincronização de Mensagens com Service Role Key e Normalização de DDI.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Aceita apenas eventos de mensagens
    if (payload.event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ status: 'ignored', event: payload.event });
    }

    const data = payload.data;
    if (!data || !data.message) {
      return NextResponse.json({ status: 'no_data' });
    }

    const instanceName = payload.instance || 'Lexis';
    const messageId = data.key?.id || '';
    const fromMe = data.key?.fromMe || false;
    const remoteJid = data.key?.remoteJid || '';
    
    // Normalização do Número: garante que salve com o DDI (55 para Brasil)
    let contactNumber = remoteJid.split('@')[0].replace(/\D/g, '');
    if (contactNumber.length === 10 || contactNumber.length === 11) {
       contactNumber = `55${contactNumber}`;
    }

    const contactName = data.pushName || 'Contato WhatsApp';
    
    const message = data.message;
    let messageText = '';

    // Extração inteligente de texto suportando múltiplos formatos
    if (message.conversation) {
      messageText = message.conversation;
    } else if (message.extendedTextMessage?.text) {
      messageText = message.extendedTextMessage.text;
    } else if (message.imageMessage?.caption) {
      messageText = message.imageMessage.caption;
    } else if (message.videoMessage?.caption) {
      messageText = message.videoMessage.caption;
    } else if (message.documentMessage?.caption) {
      messageText = message.documentMessage.caption;
    }

    const timestamp = data.messageTimestamp 
      ? new Date(Number(data.messageTimestamp) * 1000).toISOString() 
      : new Date().toISOString();

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook Error] Critical Failure:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
