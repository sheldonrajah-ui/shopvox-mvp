import { NextRequest } from 'next/server';
import { tools, handleToolCall } from './functions';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-4',
      messages,
      temperature: 0.7,
      stream: true,
      tools,
    }),
  });

  // Stream handling (simplified for MVP – pipe to frontend)
  const stream = response.body;
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}