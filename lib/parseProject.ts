import { buildImportGraph } from "./importGraph";
import { buildTree } from "./buildTree";
import { detectFrameworks } from "./framework";
import { shouldIgnore } from "./ignore";
import { languageForFile } from "./languages";
import type { LanguageStat, ProjectFile, ProjectModel } from "./types";

/** Skip individual files larger than this (bytes) — keeps memory/tokens sane. */
const MAX_FILE_BYTES = 100 * 1024;
/** Truncate stored content beyond this many characters. */
const MAX_CONTENT_CHARS = 24 * 1024;

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

/** Normalizes a browser webkitRelativePath into "root-relative/forward/slashes". */
function normalizePath(webkitRelativePath: string): { root: string; rel: string } {
  const clean = webkitRelativePath.replace(/\\/g, "/");
  const slash = clean.indexOf("/");
  if (slash === -1) return { root: "", rel: clean };
  return { root: clean.slice(0, slash), rel: clean.slice(slash + 1) };
}

export interface ParseProgress {
  processed: number;
  total: number;
}

/**
 * Reads a FileList from a <input webkitdirectory> picker, filters out noise,
 * and produces an in-memory ProjectModel. Runs entirely in the browser.
 */
export async function parseProject(
  fileList: FileList,
  onProgress?: (p: ParseProgress) => void
): Promise<ProjectModel> {
  const all = Array.from(fileList);
  const files: ProjectFile[] = [];
  let skippedCount = 0;
  let projectName = "project";

  for (let i = 0; i < all.length; i++) {
    const f = all[i];
    const { root, rel } = normalizePath(f.webkitRelativePath || f.name);
    if (root) projectName = root;

    const name = rel.split("/").pop() ?? rel;
    const ext = extOf(name);

    if (shouldIgnore(rel, name, ext)) {
      skippedCount++;
      continue;
    }
    if (f.size > MAX_FILE_BYTES) {
      skippedCount++;
      continue;
    }

    let content = "";
    try {
      content = await f.text();
    } catch {
      skippedCount++;
      continue;
    }

    const truncated = content.length > MAX_CONTENT_CHARS;
    files.push({
      path: rel,
      name,
      ext,
      size: f.size,
      content: truncated ? content.slice(0, MAX_CONTENT_CHARS) : content,
      language: languageForFile(name, ext),
      truncated,
    });

    if (onProgress && i % 20 === 0) {
      onProgress({ processed: i + 1, total: all.length });
    }
  }

  onProgress?.({ processed: all.length, total: all.length });

  return assembleModel(projectName, files, skippedCount);
}

/**
 * Builds a ProjectModel directly from raw in-memory files (path + content).
 * Used by the bundled sample project, which skips the upload/filter step.
 */
export function buildModelFromRaw(
  name: string,
  raw: { path: string; content: string }[]
): ProjectModel {
  const files: ProjectFile[] = raw.map((r) => {
    const fname = r.path.split("/").pop() ?? r.path;
    const ext = extOf(fname);
    return {
      path: r.path,
      name: fname,
      ext,
      size: r.content.length,
      content: r.content,
      language: languageForFile(fname, ext),
      truncated: false,
    };
  });
  return assembleModel(name, files, 0);
}

function assembleModel(
  name: string,
  files: ProjectFile[],
  skippedCount: number
): ProjectModel {
  const languages = computeLanguageStats(files);
  const { primary, all } = detectFrameworks(files);

  return {
    name,
    files,
    fileCount: files.length,
    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    languages,
    framework: primary,
    frameworks: all,
    tree: buildTree(files),
    graph: buildImportGraph(files),
    skippedCount,
  };
}

function computeLanguageStats(files: ProjectFile[]): LanguageStat[] {
  const map = new Map<string, LanguageStat>();
  for (const f of files) {
    const stat = map.get(f.language) ?? { language: f.language, files: 0, bytes: 0 };
    stat.files += 1;
    stat.bytes += f.size;
    map.set(f.language, stat);
  }
  return Array.from(map.values()).sort((a, b) => b.files - a.files);
}
