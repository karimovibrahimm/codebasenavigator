import { NextResponse } from "next/server";
import { parseRepoInput, type RepoRef } from "@/lib/github";
import { shouldIgnore } from "@/lib/ignore";

export const runtime = "nodejs";

/** Mirror the client-side parser's caps so GitHub imports behave like folder uploads. */
const MAX_FILE_BYTES = 100 * 1024;
const MAX_CONTENT_CHARS = 24 * 1024;
/** Hard cap on how many files we pull, to keep memory/tokens sane on big repos. */
const MAX_FILES = 400;
/** How many raw file downloads to run at once. */
const CONCURRENCY = 12;

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

function ghHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "codebase-navigator",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Turns a GitHub API error response into a friendly message. */
function describeError(status: number, ref: RepoRef): string {
  if (status === 404)
    return `Repository "${ref.owner}/${ref.repo}" not found. Is it public and spelled correctly?`;
  if (status === 403)
    return "GitHub rate limit hit. Try again later, or set GITHUB_TOKEN on the server.";
  if (status === 401) return "GitHub authentication failed (check GITHUB_TOKEN).";
  return `GitHub request failed (${status}).`;
}

export async function POST(req: Request) {
  let input: string;
  try {
    const body = await req.json();
    input = String(body.url ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ref = parseRepoInput(input);
  if (!ref) {
    return NextResponse.json(
      { error: "Couldn't parse that as a GitHub repo. Try e.g. https://github.com/owner/repo" },
      { status: 400 }
    );
  }

  try {
    // Resolve the branch (default branch unless one was given in the URL).
    let branch = ref.branch;
    if (!branch) {
      const metaRes = await fetch(
        `https://api.github.com/repos/${ref.owner}/${ref.repo}`,
        { headers: ghHeaders() }
      );
      if (!metaRes.ok) {
        return NextResponse.json(
          { error: describeError(metaRes.status, ref) },
          { status: metaRes.status === 404 ? 404 : 502 }
        );
      }
      const meta = await metaRes.json();
      branch = meta.default_branch || "main";
    }

    // Pull the full file listing in a single recursive call.
    const treeRes = await fetch(
      `https://api.github.com/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(
        branch!
      )}?recursive=1`,
      { headers: ghHeaders() }
    );
    if (!treeRes.ok) {
      return NextResponse.json(
        { error: describeError(treeRes.status, ref) },
        { status: treeRes.status === 404 ? 404 : 502 }
      );
    }
    const treeJson = await treeRes.json();
    const tree: TreeEntry[] = Array.isArray(treeJson.tree) ? treeJson.tree : [];

    // Keep only readable source blobs, applying the same filters as folder upload.
    const candidates = tree
      .filter((e) => e.type === "blob")
      .filter((e) => {
        const name = e.path.split("/").pop() ?? e.path;
        if (shouldIgnore(e.path, name, extOf(name))) return false;
        if (typeof e.size === "number" && e.size > MAX_FILE_BYTES) return false;
        return true;
      })
      .slice(0, MAX_FILES);

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No readable source files found in that repository." },
        { status: 422 }
      );
    }

    // Download raw contents. raw.githubusercontent.com doesn't count against the
    // API rate limit, so this scales better than per-file blob API calls.
    const files: { path: string; content: string }[] = [];
    let cursor = 0;
    async function worker() {
      while (cursor < candidates.length) {
        const entry = candidates[cursor++];
        const rawUrl = `https://raw.githubusercontent.com/${ref!.owner}/${ref!.repo}/${encodeURIComponent(
          branch!
        )}/${entry.path.split("/").map(encodeURIComponent).join("/")}`;
        try {
          const res = await fetch(rawUrl, { headers: ghHeaders() });
          if (!res.ok) continue;
          let content = await res.text();
          if (content.length > MAX_CONTENT_CHARS) content = content.slice(0, MAX_CONTENT_CHARS);
          files.push({ path: entry.path, content });
        } catch {
          // Skip individual files that fail to download.
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, worker)
    );

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Could not download any files from that repository." },
        { status: 502 }
      );
    }

    files.sort((a, b) => a.path.localeCompare(b.path));

    return NextResponse.json({
      name: ref.repo,
      branch,
      truncated: treeJson.truncated === true || tree.length > MAX_FILES,
      files,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch repository.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
