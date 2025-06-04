// src/app/api/getMessages/route.ts
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

export async function GET(req: NextRequest) {

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const messages = messageStore.get(sessionId);
  return NextResponse.json({ messages }, { headers: corsHeaders });
}
