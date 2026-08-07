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
    const { question, expectedAnswer, userAnswer } = await req.json();

    const prompt = `You are a strict Senior Engineer evaluating a junior's interview answer.
    Question: ${question}
    Expected Jargon Answer: ${expectedAnswer}
    User's Answer: ${userAnswer}
    
    Evaluate if the user's answer captures the core technical concept of the expected answer. 
    Do not require verbatim copying, but ensure the technical logic is correct.
    
    Respond in STRICT JSON:
    {
      "passed": true/false,
      "feedback": "A 1-sentence explanation of why they passed or failed."
    }`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    let aiText = completion.choices[0].message.content || '{}';
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(aiText);

    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error('Eval Error:', error);
    return NextResponse.json({ error: 'Failed to evaluate answer' }, { status: 500 });
  }
}