import type { ProjectModel } from "./types";

export interface RetrievedFile {
  path: string;
  language: string;
  content: string;
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "how", "does", "where", "what", "why", "who",
  "this", "that", "with", "from", "into", "你", "use", "used", "using", "can",
  "you", "your", "our", "all", "any", "get", "set", "has", "have", "was",
  "were", "will", "would", "could", "should", "about", "explain", "work",
  "works", "code", "file", "files", "project",
]);

function tokenize(query: string): string[] {
  const tokens = (query.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t)
  );
  return Array.from(new Set(tokens));
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1 && count < 30) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/**
 * Ranks project files by keyword relevance to a query and returns the top
 * matches with (truncated) content. Falls back to key/entry files when the
 * query has no strong matches. Pure heuristic — no embeddings.
 */
export function retrieveRelevantFiles(
  model: ProjectModel,
  query: string,
  limit = 5
): RetrievedFile[] {
  const tokens = tokenize(query);

  const scored = model.files.map((f) => {
    const pathLower = f.path.toLowerCase();
    const contentLower = f.content.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (pathLower.includes(t)) score += 6;
      score += countOccurrences(contentLower, t);
    }
    return { file: f, score };
  });

  let top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.file);

  // Fallback: generic question with no keyword hits — use representative files.
  if (top.length === 0) {
    const priorityNames = ["package.json", "readme.md", "index", "app", "main", "server"];
    top = model.files
      .map((f) => ({
        f,
        rank: priorityNames.findIndex((n) => f.name.toLowerCase().includes(n)),
      }))
      .sort((a, b) => {
        const ra = a.rank === -1 ? 99 : a.rank;
        const rb = b.rank === -1 ? 99 : b.rank;
        return ra - rb;
      })
      .slice(0, limit)
      .map((x) => x.f);
  }

  return top.map((f) => ({
    path: f.path,
    language: f.language,
    content: f.content.slice(0, 2200),
  }));
}
