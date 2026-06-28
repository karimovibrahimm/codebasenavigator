import type { ProjectModel, ProjectFile } from "./types";

/** Names (lowercased) of files that are especially informative for an overview. */
const KEY_FILE_NAMES = [
  "package.json",
  "readme.md",
  "readme",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "vite.config.ts",
  "vite.config.js",
  "tsconfig.json",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "cargo.toml",
  "schema.prisma",
];

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "\n…(truncated)" : text;
}

/** Returns up to `limit` files whose name matches a known key file. */
function keyFiles(model: ProjectModel, limit: number): ProjectFile[] {
  const found: ProjectFile[] = [];
  for (const target of KEY_FILE_NAMES) {
    const match = model.files.find((f) => f.name.toLowerCase() === target);
    if (match && !found.includes(match)) found.push(match);
    if (found.length >= limit) break;
  }
  return found;
}

/** A flat, capped listing of file paths for structural awareness. */
function pathListing(model: ProjectModel, cap: number): string {
  const paths = model.files.map((f) => f.path).slice(0, cap);
  const extra = model.fileCount - paths.length;
  return paths.join("\n") + (extra > 0 ? `\n…(+${extra} more files)` : "");
}

/**
 * Builds a compact, token-bounded text digest of a project for the overview
 * prompt. Includes metadata, the file listing, and contents of key files.
 */
export function buildOverviewContext(model: ProjectModel): string {
  const langs = model.languages
    .map((l) => `${l.language} (${l.files})`)
    .join(", ");

  const sections: string[] = [
    `PROJECT NAME: ${model.name}`,
    `DETECTED FRAMEWORK: ${model.framework}`,
    `DETECTED LIBRARIES: ${model.frameworks.join(", ") || "none"}`,
    `LANGUAGES: ${langs}`,
    `FILE COUNT: ${model.fileCount}`,
    "",
    "FILE LISTING:",
    pathListing(model, 200),
    "",
    "KEY FILE CONTENTS:",
  ];

  for (const f of keyFiles(model, 6)) {
    sections.push(`\n----- ${f.path} -----\n${truncate(f.content, 1800)}`);
  }

  return sections.join("\n");
}
