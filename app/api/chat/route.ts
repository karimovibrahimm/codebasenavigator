import { NextResponse } from "next/server";
import { complete, hasGroqKey, type ChatMessage } from "@/lib/groq";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTIONS = `You are an expert engineer helping a developer understand an unfamiliar codebase.
Answer the user's question using ONLY the project context and file excerpts provided.
- Be concise and concrete. Reference file paths when relevant.
- If the provided context doesn't contain the answer, say what you can infer and note that you may be missing files — do not invent specifics.
- Use short paragraphs or bullet points. No need to repeat the question.`;

interface IncomingFile {
  path: string;
  language: string;
  content: string;
}

interface Meta {
  name?: string;
  framework?: string;
  languages?: string;
}

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not set on the server." },
      { status: 503 }
    );
  }

  let question = "";
  let history: ChatMessage[] = [];
  let files: IncomingFile[] = [];
  let meta: Meta = {};
  try {
    const body = await req.json();
    question = String(body.question ?? "");
    history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    files = Array.isArray(body.files) ? body.files : [];
    meta = body.meta ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!question.trim()) {
    return NextResponse.json({ error: "Empty question." }, { status: 400 });
  }

  const contextBlock = [
    `PROJECT: ${meta.name ?? "unknown"}`,
    `FRAMEWORK: ${meta.framework ?? "unknown"}`,
    `LANGUAGES: ${meta.languages ?? "unknown"}`,
    "",
    "RELEVANT FILE EXCERPTS:",
    ...files.map((f) => `\n----- ${f.path} (${f.language}) -----\n${f.content}`),
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_INSTRUCTIONS}\n\n=== PROJECT CONTEXT ===\n${contextBlock}` },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
    { role: "user", content: question },
  ];

  try {
    const answer = await complete(messages, { temperature: 0.4, maxTokens: 900 });
    return NextResponse.json({ answer });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
