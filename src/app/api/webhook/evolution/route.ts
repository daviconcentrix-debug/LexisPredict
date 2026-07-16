/**
 * @fileOverview Webhook Evolution API → Supabase v2500.0 ELITE
 * Soberania de Dados com Service Role Key e Normalização de DDI 55.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (payload.event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ status: 'ignored' });
    }

    const data = payload.data;
    if (!data || !data.message) return NextResponse.json({ status: 'no_data' });

    const remoteJid = data.key?.remoteJid || '';
    let contactNumber = remoteJid.split('@')[0].replace(/\D/g, '');
    
    // Normalização Global DDI 55
    if (contactNumber.length === 10 || contactNumber.length === 11) {
      contactNumber = `55${contactNumber}`;
    }

    const message = data.message;
    let messageText = message.conversation || 
                      message.extendedTextMessage?.text || 
                      message.imageMessage?.caption || 
                      message.videoMessage?.caption || 
                      '';

    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        instance_name: payload.instance || 'Lexis',
        contact_number: contactNumber,
        contact_name: data.pushName || 'Contato WhatsApp',
        message_id: data.key?.id || '',
        message_text: messageText,
        from_me: data.key?.fromMe || false,
        timestamp: new Date(Number(data.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
        raw_payload: payload
      });

    if (error) console.error('[Webhook Error]', error.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
