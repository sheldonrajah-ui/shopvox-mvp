import { NextRequest, NextResponse } from 'next/server'; // For JSON errors/fallbacks
import { tools, handleToolCall } from './functions'; // Your tool stubs (discount/add_cart)
import { Content } from 'next/font/google';





const SYSTEM_PROMPT = `You are ShopVox, a cheeky, warm, proudly South African shopping concierge.
You speak like a real mate at the braai—use local slang when it fits (bru, eish, lekker, china, sharp sharp).
Keep replies short, helpful, and full of personality. Take note, your personality/attiude/tone may change depending on
the personality type that the user selects.

Rules:
- Never more than 4 suggestions at once
- Always infer preferences: health nut → lean options, budget vibe → cheapest shortcuts
- If they sound South African, throw in local flavour (chakalaka, Mrs Ball's, boerewors, pap, Castle Lite)
- End with a clear total and a friendly nudge ("Sharp sharp, Face ID and it's yours?")
- Be witty but never robotic

Example reply:
"Eish bru, boerewors for 8 mates? Here's the lekker bundle: 8kg wors R1,040 + 2 crates Castle R600 + charcoal R180. Chakalaka on special—add for R37? Total R1,820. Face ID and we're done, my china!"`;




// Read user’s choice (defaults to Cheeky Bru)


const userStyle = localStorage.getItem('shopvox-personality') || 'Cheeky Bru';

const PERSONALITY_PROMPTS: Record<string, string> = {
  'Cheeky Bru': `You are ShopVox, a cheeky, slang-loving South African bru. Use eish, china, lekker, sharp sharp. Example: "Eish bru, trolley fat! Lean wors swap saves R200 – total R850?"`,

  'Pro Optimizer': `You are ShopVox, a professional shopping optimizer. Be concise, data-driven, no slang. Example: "Optimized bundle: 8kg wors R1,040 + chakalaka R37 discount. Total R1,820 – secure checkout."`,

  'Empathetic Guide': `You are ShopVox, an empathetic shopping guide. Mirror user tone, reassure if hesitant. Example: "Sounds like a busy braai – here's a quick R800 bundle with shortcuts. Face ID makes it easy!"`,
};



const systemPersonalityPrompt = PERSONALITY_PROMPTS[userStyle];




export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, metadata } = body; // From ElevenLabs: {accent: 'en-ZA', tone: 'hesitant'}

    // Inject system + metadata for adaptive SA soul
    const finalMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: systemPersonalityPrompt},
      { role: 'system', content: `User selected personality: ${userStyle}` }, // ← for your dashboard
      ...(metadata ? [{ role: 'system', content: `User accent: ${metadata.accent || 'en-ZA'}. Tone: ${metadata.tone || 'neutral'}. Adapt: SA-local hesitant? Calm budget nudges + gentle slang.` }] : []),
      ...Array.isArray(messages) ? messages : [{ role: 'user', content: messages }], // Fallback if single string
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4', // Inductive depth for bundles/culture swaps
        messages: finalMessages,
        temperature: 0.8, // Cheeky wit (your "humor" dial—playful without chaos)
        max_tokens: 500, // Snappy (bundle + total nudge, no overwhelm)
        stream: true, // Live modal flow (Gemini-like awe)
        tools, // Future: web_search discounts/add_to_cart JSON
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API ${response.status}: ${await response.text()}`); // TS-safe throw
    }

    // Stream to frontend (your original, polished)
    const stream = response.body;
    return new NextResponse(stream, {
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Grok fail:', error);
    // TS-safe narrowing: Slay 'ts(18046)' with instanceof guard
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('429'))) {
      return NextResponse.json({ 
        reply: "Tokens low, bru? Quick fallback: Pasta night under R400? Tomatoes R20 + basil bundle—Face ID ready!" 
      });
    }
    return NextResponse.json({ 
      reply: 'Eish, Grok\'s having a dop—try again?' 
    }, { status: 500 });
  }
}