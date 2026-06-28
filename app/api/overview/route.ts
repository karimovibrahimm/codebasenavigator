import { NextResponse } from "next/server";
import { chat, hasGroqKey } from "@/lib/groq";

export const runtime = "nodejs";

const SYSTEM = `You are a senior software engineer who explains unfamiliar codebases to other developers.
You are given a digest of a project: its detected framework, languages, file listing, and the contents of a few key files.
Respond ONLY with a JSON object of this exact shape:
{
  "summary": "2-4 sentence plain-English explanation of what this project is and does",
  "architecture": "3-5 short sentences describing the high-level architecture (frontend, backend, data, auth, etc.) based on the evidence",
  "highlights": ["short bullet", "short bullet", "short bullet"]
}
Base every claim on the provided evidence. If something is unclear, say so briefly rather than inventing details. Do not include markdown fences.`;

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not set on the server." },
      { status: 503 }
    );
  }

  let context: string;
  try {
    const body = await req.json();
    context = String(body.context ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!context.trim()) {
    return NextResponse.json({ error: "Empty project context." }, { status: 400 });
  }

  try {
    const raw = await chat({
      system: SYSTEM,
      user: context,
      temperature: 0.3,
      maxTokens: 900,
    });

    const parsed = safeParse(raw);
    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface OverviewResult {
  summary: string;
  architecture: string;
  highlights: string[];
}

/** Tolerant JSON parsing — strips fences and falls back to plain text. */
function safeParse(raw: string): OverviewResult {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    return {
      summary: String(obj.summary ?? "").trim(),
      architecture: String(obj.architecture ?? "").trim(),
      highlights: Array.isArray(obj.highlights)
        ? obj.highlights.map((h: unknown) => String(h)).slice(0, 6)
        : [],
    };
  } catch {
    return { summary: cleaned, architecture: "", highlights: [] };
  }
}
