"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Github, 
  Network, 
  Brain, 
  HelpCircle, 
  Send, 
  Loader2, 
  Code2, 
  ArrowRight,
  MessageSquare,
  Bookmark,
  Copy,
  Check
} from "lucide-react";
import MemoryBank from "./components/MemoryBank";

interface InterviewQuestion {
  id: string;
  level: string;
  question: string;
  answer: string;
}

interface AnalysisResult {
  dataFlow: string;
  architectureWhy: string;
  questions: InterviewQuestion[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ArchitectureDecoderPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [difficulty, setDifficulty] = useState("Random");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, { passed: boolean; feedback: string }>>({});
  const [evalLoading, setEvalLoading] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bankUpdateTrigger, setBankUpdateTrigger] = useState(0);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;
    
    setLoading(true);
    setError("");
    setResult(null);
    setChatMessages([]);
    setUserAnswers({});
    setEvaluations({});

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, difficulty }),
      });

      if (!response.ok) throw new Error("Failed to analyze repository");
      
      const data = await response.json();
      setResult(data);
      setChatMessages([
        { role: "assistant" as const, content: `I've finished analyzing ${repoUrl}. Ask me anything!` }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !result) return;

    const userMessage = chatInput;
    const newMessages = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, message: userMessage, history: newMessages }),
      });
      const data = await response.json();
      setChatMessages([...newMessages, { role: "assistant" as const, content: data.reply }]);
    } catch (err) {
      setChatMessages([...newMessages, { role: "assistant" as const, content: "Error connecting to AI." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleEvaluate = async (q: InterviewQuestion) => {
    const userAns = userAnswers[q.id] || "";
    if (!userAns.trim()) return;

    setEvalLoading(prev => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, expectedAnswer: q.answer, userAnswer: userAns }),
      });
      const data = await res.json();
      setEvaluations(prev => ({ ...prev, [q.id]: data }));
    } catch (err) {
      setEvaluations(prev => ({ ...prev, [q.id]: { passed: false, feedback: "Failed to evaluate." } }));
    } finally {
      setEvalLoading(prev => ({ ...prev, [q.id]: false }));
    }
  };

  const saveToBank = (q: InterviewQuestion) => {
    const saved = localStorage.getItem("arch_memory_bank");
    const bank = saved ? JSON.parse(saved) : [];
    bank.push({ question: q.question, answer: q.answer, level: q.level });
    localStorage.setItem("arch_memory_bank", JSON.stringify(bank));
    setBankUpdateTrigger(prev => prev + 1);
    alert("Saved to Memory Bank!");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const passedCount = Object.values(evaluations).filter(e => e?.passed).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Network className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Architecture Decoder</h1>
              <p className="text-xs text-zinc-500">AI Repo Analysis & Interactive Mentor</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input type="text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/vercel/next.js" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" required />
            </div>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500">
              <option>Random</option>
              <option>Junior</option>
              <option>Mid-Level</option>
              <option>Senior</option>
            </select>
            <button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Scanning...</span></> : <><span>Decode</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Network className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">Data Flow Mapping</h2>
                </div>
                <div className="text-sm text-zinc-300 bg-zinc-950 p-4 rounded border border-zinc-800 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{result.dataFlow}</ReactMarkdown>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold">Architectural "Why"</h2>
                </div>
                <div className="text-sm text-zinc-300 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{result.architectureWhy}</ReactMarkdown>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col h-[400px]">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">AI Architecture Mentor</h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-100"}`}>{msg.content}</div>
                    </div>
                  ))}
                  {chatLoading && <div className="flex justify-start"><div className="bg-zinc-800 p-3 rounded-lg"><Loader2 className="w-4 h-4 animate-spin text-zinc-400" /></div></div>}
                </div>
                <form onSubmit={handleChat} className="flex gap-2">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about patterns, bottlenecks..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  <button type="submit" disabled={chatLoading} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 p-2 rounded-lg"><Send className="w-5 h-5 text-emerald-400" /></button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-zinc-400">Interview Progress</h3>
                  <span className="text-emerald-400 text-sm font-bold">{passedCount}/5 Passed</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(passedCount / 5) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold">Interview Simulator</h2>
                </div>
                <div className="space-y-4">
                  {result.questions.map((q, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${q.level === "Junior" ? "bg-green-900/50 text-green-400" : q.level === "Mid-Level" || q.level === "Mid" ? "bg-blue-900/50 text-blue-400" : "bg-purple-900/50 text-purple-400"}`}>{q.level}</span>
                        <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(q.answer, q.id)} className="text-zinc-500 hover:text-white">
                            {copiedId === q.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button onClick={() => saveToBank(q)} className="text-zinc-500 hover:text-blue-400"><Bookmark className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-200 mb-3">{q.question}</p>
                      
                      <textarea 
                        value={userAnswers[q.id] || ""} 
                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} 
                        placeholder="Type your answer here..." 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs mb-2 h-20 resize-none focus:outline-none focus:border-emerald-500"
                      />
                      <button 
                        onClick={() => handleEvaluate(q)} 
                        disabled={evalLoading[q.id]} 
                        className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs py-2 rounded flex items-center justify-center gap-2"
                      >
                        {evalLoading[q.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Code2 className="w-3 h-3" />}
                        Submit Answer
                      </button>

                      {evaluations[q.id] && (
                        <div className={`mt-2 p-2 rounded text-xs ${evaluations[q.id].passed ? "bg-emerald-900/30 border border-emerald-800 text-emerald-300" : "bg-red-900/30 border border-red-800 text-red-300"}`}>
                          <p className="font-bold mb-1">{evaluations[q.id].passed ? "✅ Passed!" : "❌ Retry"}</p>
                          <p className="text-zinc-400">{evaluations[q.id].feedback}</p>
                          {!evaluations[q.id].passed && <p className="text-zinc-500 mt-1 italic">Expected: {q.answer}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <MemoryBank key={bankUpdateTrigger} />

        {!result && !loading && (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <Network className="w-16 h-16 text-zinc-800 mb-4" />
            <h2 className="text-xl text-zinc-500">Ready to decode</h2>
            <p className="text-zinc-600 text-sm mt-2 max-w-md">Enter a GitHub URL to map architecture, get mentorship, and test your knowledge.</p>
          </div>
        )}
      </main>
    </div>
  );
}