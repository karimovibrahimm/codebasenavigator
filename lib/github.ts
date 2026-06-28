/** Parsed reference to a GitHub repository. */
export interface RepoRef {
  owner: string;
  repo: string;
  /** Optional branch/ref; when omitted the caller resolves the default branch. */
  branch?: string;
}

/**
 * Parses the many shapes a user might paste for a GitHub repo into owner/repo
 * (+ optional branch). Accepts, for example:
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo.git
 *   - https://github.com/owner/repo/tree/some-branch
 *   - git@github.com:owner/repo.git
 *   - owner/repo
 *   - owner/repo@branch
 * Returns null if it can't recognize a repo.
 */
export function parseRepoInput(input: string): RepoRef | null {
  let s = input.trim();
  if (!s) return null;

  // git@github.com:owner/repo.git  ->  owner/repo
  const scp = s.match(/^git@github\.com:(.+)$/i);
  if (scp) s = scp[1];

  // Strip a protocol + host if present.
  s = s.replace(/^https?:\/\//i, "").replace(/^(www\.)?github\.com\//i, "");

  // "owner/repo@branch" shorthand.
  let shorthandBranch: string | undefined;
  const at = s.indexOf("@");
  if (at !== -1 && !s.slice(0, at).includes("/")) {
    // "@" before any slash isn't our shorthand (e.g. scoped paths) — ignore.
  } else if (at !== -1) {
    shorthandBranch = s.slice(at + 1) || undefined;
    s = s.slice(0, at);
  }

  const parts = s.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  let repo = parts[1].replace(/\.git$/i, "");
  if (!owner || !repo) return null;

  // Optional ".../tree/<branch>" (or "/blob/<branch>") segment.
  let branch = shorthandBranch;
  if (parts.length >= 4 && (parts[2] === "tree" || parts[2] === "blob")) {
    branch = parts.slice(3).join("/") || branch;
  }

  return { owner, repo, branch };
}
