// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1"
});

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const systemPrompt = `You are an elite Staff Engineer and technical mentor. 
    The user is asking you questions about a GitHub repository they just analyzed. 
    Explain concepts clearly, mapping them to the code they built. Use industry-standard jargon but explain it simply (ELI5).`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((msg: any) => ({ role: msg.role, content: msg.content }))
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: 'Failed to get chat response' }, { status: 500 });
  }
}