import { NextResponse } from "next/server";
import { chat, hasGroqKey } from "@/lib/groq";

export const runtime = "nodejs";

const SYSTEM = `You explain one architectural layer of a codebase to a new developer.
You are given the layer name and a sample of files (with short snippets) that belong to it.
Respond with 2-4 plain sentences describing what this layer does in THIS project and how the listed files contribute.
Be specific and grounded in the provided files. Plain text only — no markdown, no JSON.`;

interface FileSnippet {
  path: string;
  snippet: string;
}

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not set on the server." },
      { status: 503 }
    );
  }

  let label = "";
  let files: FileSnippet[] = [];
  try {
    const body = await req.json();
    label = String(body.label ?? "");
    files = Array.isArray(body.files) ? body.files : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fileText = files
    .slice(0, 8)
    .map((f) => `----- ${f.path} -----\n${String(f.snippet).slice(0, 600)}`)
    .join("\n\n");

  const user = `ARCHITECTURE LAYER: ${label}\n\nFILES:\n${fileText}`;

  try {
    const description = await chat({
      system: SYSTEM,
      user,
      temperature: 0.3,
      maxTokens: 350,
    });
    return NextResponse.json({ description });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
