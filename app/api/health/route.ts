import { NextResponse } from "next/server";
import { GROQ_MODEL, hasGroqKey } from "@/lib/groq";

export async function GET() {
  return NextResponse.json({
    ok: true,
    groqKey: hasGroqKey(),
    model: GROQ_MODEL,
  });
}
