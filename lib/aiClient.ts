import type { FileAnalysis, OverviewResult } from "./types";

/** POSTs JSON to an API route and returns the parsed response, throwing on error. */
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status}).`);
  }
  return data as T;
}

export function fetchOverview(context: string): Promise<OverviewResult> {
  return postJson<OverviewResult>("/api/overview", { context });
}

/** Raw files for a GitHub repo, fetched + filtered server-side. */
export function fetchGithubProject(url: string): Promise<{
  name: string;
  branch: string;
  truncated: boolean;
  files: { path: string; content: string }[];
}> {
  return postJson("/api/github", { url });
}

export function fetchFileAnalysis(
  path: string,
  language: string,
  content: string
): Promise<FileAnalysis> {
  return postJson<FileAnalysis>("/api/file", { path, language, content });
}

export function fetchArchitecture(
  label: string,
  files: { path: string; snippet: string }[]
): Promise<{ description: string }> {
  return postJson<{ description: string }>("/api/architecture", { label, files });
}

export function fetchChat(payload: {
  question: string;
  history: { role: string; content: string }[];
  files: { path: string; language: string; content: string }[];
  meta: { name?: string; framework?: string; languages?: string };
}): Promise<{ answer: string }> {
  return postJson<{ answer: string }>("/api/chat", payload);
}
