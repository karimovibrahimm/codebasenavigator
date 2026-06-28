import { NextResponse } from "next/server";
import { chat, hasGroqKey } from "@/lib/groq";

export const runtime = "nodejs";

const SYSTEM = `You are a senior engineer explaining one source file to a developer who is new to the codebase.
You are given the file path, its language, and its contents.
Respond ONLY with a JSON object of this exact shape:
{
  "purpose": "1-2 sentence explanation of why this file exists and what it is for",
  "responsibilities": ["short responsibility", "short responsibility", "short responsibility"]
}
Keep responsibilities concrete and specific to THIS file (3-6 items). Base everything on the actual code. No markdown fences.`;

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not set on the server." },
      { status: 503 }
    );
  }

  let path = "";
  let language = "";
  let content = "";
  try {
    const body = await req.json();
    path = String(body.path ?? "");
    language = String(body.language ?? "");
    content = String(body.content ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!content.trim()) {
    return NextResponse.json(
      { purpose: "This file is empty.", responsibilities: [] },
      { status: 200 }
    );
  }

  const user = `FILE: ${path}\nLANGUAGE: ${language}\n\nCONTENTS:\n${content.slice(0, 12000)}`;

  try {
    const raw = await chat({
      system: SYSTEM,
      user,
      temperature: 0.3,
      maxTokens: 600,
    });
    return NextResponse.json(safeParse(raw));
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function safeParse(raw: string): { purpose: string; responsibilities: string[] } {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    return {
      purpose: String(obj.purpose ?? "").trim(),
      responsibilities: Array.isArray(obj.responsibilities)
        ? obj.responsibilities.map((r: unknown) => String(r)).slice(0, 8)
        : [],
    };
  } catch {
    return { purpose: cleaned, responsibilities: [] };
  }
}
