import type { OverviewResult, ProjectModel, TreeNode } from "./types";

/** Maps a language label to a Markdown code-fence info string. */
const FENCE_LANG: Record<string, string> = {
  TypeScript: "ts",
  "TypeScript (React)": "tsx",
  JavaScript: "js",
  "JavaScript (React)": "jsx",
  Python: "python",
  JSON: "json",
  Markdown: "md",
  HTML: "html",
  CSS: "css",
  Shell: "bash",
  YAML: "yaml",
  Go: "go",
  Rust: "rust",
  Java: "java",
  Ruby: "ruby",
  PHP: "php",
};

function fenceLang(language: string): string {
  return FENCE_LANG[language] ?? "";
}

/**
 * Renders a project tree as an ASCII map, e.g.
 *   src/
 *   ├── index.ts
 *   └── ui/
 *       └── Button.tsx
 */
export function renderTreeAscii(root: TreeNode): string {
  const lines: string[] = [];

  function walk(nodes: TreeNode[], prefix: string) {
    nodes.forEach((node, i) => {
      const last = i === nodes.length - 1;
      const branch = last ? "└── " : "├── ";
      const label = node.type === "folder" ? `${node.name}/` : node.name;
      lines.push(`${prefix}${branch}${label}`);
      if (node.type === "folder" && node.children?.length) {
        walk(node.children, prefix + (last ? "    " : "│   "));
      }
    });
  }

  walk(root.children ?? [], "");
  return lines.join("\n");
}

/**
 * Picks a fenced-block delimiter that won't collide with content. Most files
 * use ``` so we default to ```` (four ticks); if a file actually contains four
 * ticks we step up further.
 */
function fenceFor(content: string): string {
  let fence = "````";
  while (content.includes(fence)) fence += "`";
  return fence;
}

export interface BundleOptions {
  /** When true, emit only the tree map (no file contents). */
  mapOnly?: boolean;
  /** The AI overview (summary, architecture, highlights) to prepend, if ready. */
  overview?: OverviewResult | null;
}

/**
 * Builds a single self-contained Markdown document describing the whole project:
 * a header, an ASCII file map, and (unless mapOnly) every file's contents. The
 * result is meant to be pasted into or uploaded to an AI assistant.
 */
export function buildMarkdownBundle(
  model: ProjectModel,
  opts: BundleOptions = {}
): string {
  const out: string[] = [];

  out.push(`# ${model.name}`);
  out.push("");
  const langs = model.languages
    .slice(0, 6)
    .map((l) => l.language)
    .join(", ");
  out.push(
    `> ${model.framework !== "Unknown" ? `${model.framework} · ` : ""}` +
      `${model.fileCount} files${langs ? ` · ${langs}` : ""}`
  );
  if (opts.mapOnly) {
    out.push("> (file map only — source omitted)");
  }
  out.push("");

  const ov = opts.overview;
  if (ov && (ov.summary || ov.architecture || ov.highlights.length)) {
    out.push("## Summary");
    out.push("");
    if (ov.summary.trim()) {
      out.push(ov.summary.trim());
      out.push("");
    }
    if (ov.architecture.trim()) {
      out.push("**Architecture.** " + ov.architecture.trim());
      out.push("");
    }
    if (ov.highlights.length) {
      out.push("**Highlights:**");
      for (const h of ov.highlights) out.push(`- ${h}`);
      out.push("");
    }
  }

  out.push("## File map");
  out.push("");
  out.push("```");
  out.push(`${model.name}/`);
  out.push(renderTreeAscii(model.tree));
  out.push("```");
  out.push("");

  if (opts.mapOnly) return out.join("\n");

  out.push("## Files");
  out.push("");
  for (const file of model.files) {
    out.push(`### ${file.path}`);
    out.push("");
    const fence = fenceFor(file.content);
    out.push(`${fence}${fenceLang(file.language)}`);
    out.push(file.content.replace(/\n+$/, ""));
    out.push(fence);
    if (file.truncated) out.push("_…file truncated for length._");
    out.push("");
  }

  return out.join("\n");
}

/** A safe-ish filename for the downloaded bundle. */
export function bundleFilename(name: string, mapOnly: boolean): string {
  const slug = name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "project";
  return `${slug}${mapOnly ? "-map" : "-bundle"}.md`;
}

/** Triggers a browser download of `text` as a file named `filename`. */
export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
