// src/app/api/sendMessage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { messageStore } from '@/app/api/telegramWebhook/store';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

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

  const { message, sessionId } = await req.json();

  if (!message || !sessionId) {
    return NextResponse.json({ error: 'Message and sessionId required' }, { status: 400 });
  }

  // Prefix message with sessionId to track it
  const prefixedMessage = `[${sessionId}] ${message}`;

  // Send to Telegram
  const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: prefixedMessage,
    }),
  });

  const data = await telegramRes.json();

  if (!data.ok) {
    return NextResponse.json({ error: 'Failed to send to Telegram', details: data }, { status: 500 });
  }

  // Save user's original message locally (without prefix)
  messageStore.add(sessionId, { from: 'user', text: message });

  return NextResponse.json({ status: 'sent', telegram: data }, { headers: corsHeaders });
}
