// src/app/api/telegramWebhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { messageStore } from '@/app/api/telegramWebhook/store';

const allowedOrigins = ['http://localhost:3000', 'https://mycoco.site', 'http://35.154.2.48', 'http://35.154.2.48:3000'];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && allowedOrigins.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req: NextRequest) {

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  const body = await req.json();

  // Get the Telegram bot's sent message text
  const text = body?.message?.text || body?.edited_message?.text;
  if (!text) return NextResponse.json({ ok: true });

  // Try to extract [sessionId] prefix from message text
  // Format: [sessionId] rest of message
  const match = text.match(/^\[(.+?)\]\s*(.*)$/);
  if (!match) {
    // No sessionId prefix found, ignore message or log if needed
    console.warn('No sessionId prefix in bot message:', text);
    return NextResponse.json({ ok: true });
  }

  const [, sessionId, messageText] = match;

  // Use 'Bot' as sender by default
  const from = body?.message?.from?.first_name || 'Bot';

  // Save bot message text for that session
  messageStore.add(sessionId, { text: messageText, from });

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}
