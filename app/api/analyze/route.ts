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
    const { repoUrl, difficulty } = await req.json();

    if (!repoUrl || !repoUrl.includes('github.com/')) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const match = repoUrl.match(/github.com\/([^/]+)\/([^/]+)/);
    if (!match) return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    
    const owner = match[1];
    const repo = match[2].replace('.git', '').replace(/\/$/, '');

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers: { 'User-Agent': 'Arch-Decoder-AI' }
    });

    if (!treeRes.ok) {
      const masterRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
        headers: { 'User-Agent': 'Arch-Decoder-AI' }
      });
      if (!masterRes.ok) return NextResponse.json({ error: 'Could not fetch repository tree.' }, { status: 500 });
      const masterData = await masterRes.json();
      return await analyzeRepo(owner, repo, masterData, groq, difficulty);
    }

    const treeData = await treeRes.json();
    return await analyzeRepo(owner, repo, treeData, groq, difficulty);

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to analyze repository' }, { status: 500 });
  }
}

async function analyzeRepo(owner: string, repo: string, treeData: any, groq: OpenAI, difficulty: string) {
  const importantFiles = treeData.tree.filter((file: any) => 
    file.type === 'blob' && 
    (file.path.includes('package.json') || 
     file.path.includes('README') || 
     file.path.includes('main.') || 
     file.path.includes('index.') ||
     (file.path.includes('app/') && (file.path.endsWith('.ts') || file.path.endsWith('.js') || file.path.endsWith('.tsx')))
    )
  ).slice(0, 5);

  const fileContents = [];

  for (const file of importantFiles) {
    const contentRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`);
    if (contentRes.ok) {
      const content = await contentRes.text();
      fileContents.push({ path: file.path, content: content.substring(0, 2000) });
    }
  }

  const prompt = `You are an elite Staff Engineer and technical mentor. Analyze the following GitHub repository structure and file contents.
  
  Repository Structure (File Paths):
  ${treeData.tree.map((f: any) => f.path).join('\n')}
  
  --- FILE CONTENTS ---
  ${JSON.stringify(fileContents, null, 2)}
  --- END FILE CONTENTS ---
  
  Your task is to generate an analysis JSON to help the developer understand their own architecture.
  
  INTERVIEW QUESTION GENERATION:
  The user has selected the difficulty level: "${difficulty}".
  If the difficulty is "Random", randomly select from ["Junior", "Mid-Level", "Senior"].
  YOU MUST generate exactly 5 interview-style questions about the codebase AT THAT SPECIFIC DIFFICULTY LEVEL.
  
  Respond in STRICT JSON format only:
  {
    "dataFlow": "A string mapping the data flow step-by-step in Markdown format",
    "architectureWhy": "2-3 sentences explaining WHY the code was structured this way",
    "questions": [
      {
        "id": "q1",
        "level": "The chosen difficulty",
        "question": "The interview question text",
        "answer": "The exact technical industry jargon a Senior Dev would use to answer this in an interview"
      },
      ... (exactly 5 questions total)
    ]
  }`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.6,
    max_tokens: 2000,
  });

  let aiText = completion.choices[0].message.content || '{}';
  let aiData;

  try {
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = aiText.indexOf('{');
    const jsonEnd = aiText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      aiText = aiText.substring(jsonStart, jsonEnd + 1);
    }
    aiData = JSON.parse(aiText);
  } catch (parseError) {
    console.error('JSON Parse Failed, returning raw text.');
    aiData = { error: "Failed to parse AI response", raw: aiText };
  }

  return NextResponse.json({ success: true, ...aiData });
}