// src/app/api/telegramWebhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { messageStore } from '@/app/api/telegramWebhook/store';

const allowedOrigins = ['http://localhost:3000', 'https://mycoco.site', 'http://35.154.2.48', 'http://35.154.2.48:3000'];

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

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

  const messageText = body?.message?.text;
  if (!messageText) return NextResponse.json({ ok: true });
  // Extract sessionId from message like: [sessionId] actual message
  const match = messageText.match(/^\[(.+?)\]\s(.+)$/);
  if (!match) {
    console.warn('No sessionId found in message');
    return NextResponse.json({ ok: true });
  }

  const sessionId = match[1];
  const actualText = match[2];

  // Store the user's message (cleaned)
  messageStore.add(sessionId, { from: 'user', text: actualText });

  // Generate bot's reply (you can replace this logic with AI or any business rule)
  const botReply = `Hello! You said: ${actualText}`;

  // Store the bot's reply in the same session
  messageStore.add(sessionId, { from: 'bot', text: botReply });

  // Send reply to Telegram (so user on phone still sees it)
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: botReply,
    }),
  });

  return NextResponse.json({ ok: true });
}