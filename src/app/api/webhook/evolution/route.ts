/**
 * @fileOverview Webhook Evolution API → Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Aceita MESSAGES_UPSERT
    if (payload.event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ status: 'ignored', event: payload.event });
    }

    const data = payload.data;
    if (!data) {
      return NextResponse.json({ status: 'no_data' });
    }

    const instanceName = payload.instance || 'Lexis';
    const messageId = data.key?.id || '';
    const fromMe = data.key?.fromMe || false;
    const remoteJid = data.key?.remoteJid || '';
    const contactNumber = remoteJid.split('@')[0];
    const contactName = data.pushName || 'Contato WhatsApp';

    // Extração de texto
    const message = data.message || {};
    let messageText = '';

    if (message.conversation) {
      messageText = message.conversation;
    } else if (message.extendedTextMessage?.text) {
      messageText = message.extendedTextMessage.text;
    } else if (message.imageMessage?.caption) {
      messageText = message.imageMessage.caption;
    } else if (message.videoMessage?.caption) {
      messageText = message.videoMessage.caption;
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
      console.error('[Webhook] Erro ao salvar no Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Erro crítico:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
