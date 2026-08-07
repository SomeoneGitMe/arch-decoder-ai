🧠 Architecture Decoder (AI Repo Analyzer)
An autonomous developer tool that bridges the gap between "I built it with AI" and "I can explain it in an interview." Paste a GitHub repository URL, and the AI scrapes the file tree, reads the core files, and generates a complete architectural breakdown, an interactive AI mentor, and a difficulty-targeted interview simulator.

🧠 How It Works
GitHub API Integration: The backend parses the URL and queries the GitHub Git Trees API to fetch the complete file structure.
File Filtering & Ingestion: The system filters for "core" files (package.json, README, main/index entry points, and root app/ directories) and fetches their raw content.
LLM Synthesis: The file tree and contents are sent to Groq (Llama-3.3-70b). The LLM generates:
Data Flow Map: A step-by-step trace of how data moves through the app.
Architectural "Why": An explanation of the design decisions and patterns used.
Interview Simulator: 3 randomized interview questions at a user-selected difficulty level (Junior, Mid-Level, Senior), complete with Senior Jargon answers.
Interactive Mentor: A chat interface allowing the user to ask follow-up questions about the codebase.
🛠 Tech Stack
Frontend: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons, TypeScript
Backend: Next.js Serverless API Routes (Node.js Runtime)
AI/LLM: Groq (Llama-3.3-70b-versatile)
External API: GitHub Git Trees API & raw.githubusercontent.com
💻 Engineering Highlights
Context Window Management: Implemented intelligent file filtering logic to ensure only the most architecturally significant files are sent to the LLM, preventing token limit crashes while maintaining high-quality analysis.
Dynamic Prompt Engineering: Architected a dynamic prompt pipeline that adjusts the difficulty of the generated interview questions based on user input, mapping subconscious code logic to formal industry jargon.
Interactive RAG Mentor: Built a secondary chat API route that maintains conversational context, allowing developers to interrogate their own codebase architecture in real-time.

🚀 Live Demo URL: [Insert your Vercel URL here once deployed]