// app/api/grok/route.ts 

import { NextRequest } from 'next/server';
import { tools, handleToolCall } from './functions';

export const dynamic = 'force-dynamic';

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

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const choice = parsed.choices[0];

            // Detect tool call completion
            if (choice.finish_reason === 'tool_calls') {
              const toolCall = choice.message.tool_calls[0];
              const toolResult = await handleToolCall(toolCall);

              // Second call to Grok with the tool result
              const followUp = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'grok-4',
                  messages: [
                    ...messages,
                    choice.message,
                    {
                      role: 'tool',
                      tool_call_id: toolCall.id,
                      content: toolResult,
                    },
                  ],
                  stream: true,
                }),
              });

              // Properly pipe the second stream (this is the bulletproof way)
              const followUpReader = followUp.body!.getReader();
              while (true) {
                const { done, value } = await followUpReader.read();
                if (done) break;
                controller.enqueue(value);
              }
              controller.close();
              return;
            }

            // Normal text streaming
            if (choice.delta?.content) {
              const sse = `data: ${JSON.stringify(parsed)}\n\n`;
              controller.enqueue(new TextEncoder().encode(sse));
            }
          } catch (e) {
            // Ignore JSON parse errors on partial chunks
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}