"use client";

import { useEffect, useState } from "react";
import { Trash2, BookMarked } from "lucide-react";

interface SavedQuestion {
  question: string;
  answer: string;
  level: string;
}

export default function MemoryBank() {
  const [bank, setBank] = useState<SavedQuestion[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("arch_memory_bank");
    if (saved) setBank(JSON.parse(saved));
  }, []);

  const removeFromBank = (index: number) => {
    const newBank = [...bank];
    newBank.splice(index, 1);
    setBank(newBank);
    localStorage.setItem("arch_memory_bank", JSON.stringify(newBank));
  };

  if (bank.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-6">
      <div className="flex items-center space-x-2 mb-4">
        <BookMarked className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold">Memory Bank</h2>
      </div>
      <div className="space-y-3">
        {bank.map((item, idx) => (
          <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex justify-between items-start">
            <div>
              <span className="text-xs text-zinc-500">{item.level}</span>
              <p className="text-sm text-zinc-300 font-medium mt-1">{item.question}</p>
              <p className="text-xs text-zinc-500 mt-2 italic">AI Answer: {item.answer}</p>
            </div>
            <button onClick={() => removeFromBank(idx)} className="text-zinc-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}