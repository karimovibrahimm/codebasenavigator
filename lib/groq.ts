import Groq from "groq-sdk";

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

let client: Groq | null = null;

/** Returns a singleton Groq client, or null if no API key is configured. */
export function getGroq(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

interface ChatOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Thin wrapper around a single chat completion. Throws if no key is set so
 * callers can surface a clear "missing key" message to the UI.
 */
export async function chat({
  system,
  user,
  temperature = 0.4,
  maxTokens = 1024,
}: ChatOptions): Promise<string> {
  const groq = getGroq();
  if (!groq) {
    throw new Error("GROQ_API_KEY is not set. Add it to .env.local.");
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Multi-message completion for the chat feature (supports history). */
export async function complete(
  messages: ChatMessage[],
  { temperature = 0.4, maxTokens = 1024 }: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const groq = getGroq();
  if (!groq) {
    throw new Error("GROQ_API_KEY is not set. Add it to .env.local.");
  }
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature,
    max_tokens: maxTokens,
    messages,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}
