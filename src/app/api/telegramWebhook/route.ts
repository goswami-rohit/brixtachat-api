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

  try {
    const body = await req.json();
    const messageText = body?.message?.text;
    
    if (!messageText) {
      return NextResponse.json({ ok: true }, { headers: corsHeaders });
    }

    // Try to extract sessionId from message like: [sessionId] actual message
    const match = messageText.match(/^\[(.+?)\]\s(.+)$/);
    
    if (match) {
      // This is a user message with sessionId prefix
      const sessionId = match[1];
      const actualText = match[2];

      // Store the user's message (cleaned)
      messageStore.add(sessionId, { from: 'user', text: actualText });

      // Generate bot's reply
      const botReply = `Hello! You said: ${actualText}`;

      // Store the bot's reply in the same session
      messageStore.add(sessionId, { from: 'bot', text: botReply });

      // Send reply to Telegram
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: botReply,
        }),
      });
    } else {
      // This is likely a bot reply without sessionId prefix
      // Find the most recent session and add the bot message
      const sessionId = messageStore.findSessionForBotReply(TELEGRAM_CHAT_ID);
      
      if (sessionId) {
        // Store the bot's message
        messageStore.add(sessionId, { from: 'bot', text: messageText });
      } else {
        console.warn('No active session found for bot reply:', messageText);
      }
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in telegramWebhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}