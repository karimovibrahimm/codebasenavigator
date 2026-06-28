import type { ImportGraph, ProjectFile } from "./types";

/** Extensions we try to resolve relative imports against. */
const RESOLVE_EXTS = ["ts", "tsx", "js", "jsx", "mjs", "cjs", "vue", "svelte"];
const INDEX_FILES = RESOLVE_EXTS.map((e) => `index.${e}`);

/** Matches `import ... from '...'`, `require('...')`, and dynamic `import('...')`. */
const IMPORT_RE =
  /(?:import\s[^'"]*?from\s*|import\s*|require\s*\(\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;

/**
 * Builds a best-effort import graph from relative imports between project
 * files. Bare/package imports (e.g. "react") are ignored — we only link files
 * that exist in the uploaded project. Heuristic, not a real resolver.
 */
export function buildImportGraph(files: ProjectFile[]): ImportGraph {
  const pathSet = new Set(files.map((f) => f.path));
  const dependsOn: Record<string, string[]> = {};
  const usedBy: Record<string, string[]> = {};

  for (const file of files) {
    const deps = new Set<string>();
    let match: RegExpExecArray | null;
    IMPORT_RE.lastIndex = 0;
    while ((match = IMPORT_RE.exec(file.content)) !== null) {
      const spec = match[1];
      if (!spec.startsWith(".")) continue; // skip packages / aliases
      const resolved = resolveRelative(file.path, spec, pathSet);
      if (resolved && resolved !== file.path) deps.add(resolved);
    }
    dependsOn[file.path] = Array.from(deps);
  }

  // Invert to build usedBy.
  for (const file of files) usedBy[file.path] = [];
  for (const [from, targets] of Object.entries(dependsOn)) {
    for (const target of targets) {
      usedBy[target]?.push(from);
    }
  }

  return { dependsOn, usedBy };
}

/** Resolves a relative import specifier to an actual project file path. */
function resolveRelative(
  fromPath: string,
  spec: string,
  pathSet: Set<string>
): string | null {
  const baseDir = fromPath.split("/").slice(0, -1);
  const parts = spec.split("/");
  const stack = [...baseDir];

  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  const target = stack.join("/");

  // Exact match (spec already had an extension).
  if (pathSet.has(target)) return target;
  // Try appending known extensions.
  for (const ext of RESOLVE_EXTS) {
    if (pathSet.has(`${target}.${ext}`)) return `${target}.${ext}`;
  }
  // Try as a directory with an index file.
  for (const idx of INDEX_FILES) {
    if (pathSet.has(`${target}/${idx}`)) return `${target}/${idx}`;
  }
  return null;
}
