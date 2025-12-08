import { NextRequest, NextResponse } from 'next/server';

// Keep the key completely server-side
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get('audio') as Blob;
  const action = formData.get('action') as string; // "stt" or "tts"
  const text = formData.get('text') as string | null;
  const voiceId = formData.get('voice_id') as string || "pNInz6obpgDQGcFmaJgB";

  if (!ELEVEN_API_KEY) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  if (action === 'stt') {
    const sttForm = new FormData();
    sttForm.append('file', audio, 'query.webm');

    const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVEN_API_KEY },
      body: sttForm,
    });
    const data = await sttRes.json();
    return NextResponse.json(data);
  }

  if (action === 'tts' && text) {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.6, similarity_boost: 0.8 }
      }),
    });

    return new NextResponse(ttsRes.body, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}