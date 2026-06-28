/** A single source file held in memory after upload. */
export interface ProjectFile {
  /** Relative path from the project root, using forward slashes. */
  path: string;
  /** File name only, e.g. "index.tsx". */
  name: string;
  /** Lowercased extension without the dot, e.g. "tsx". "" if none. */
  ext: string;
  /** Byte size of the original file. */
  size: number;
  /** Text content. May be truncated for very large files. */
  content: string;
  /** Human-readable language label, e.g. "TypeScript". */
  language: string;
  /** True if content was truncated to keep payloads small. */
  truncated: boolean;
}

export interface LanguageStat {
  language: string;
  files: number;
  bytes: number;
}

/** A node in the file explorer tree. */
export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
  /** Present on file nodes: index into ProjectModel.files. */
  fileIndex?: number;
}

/** Edges of the import graph, keyed by file path. Filled in Phase 4. */
export interface ImportGraph {
  /** path -> list of project file paths it imports. */
  dependsOn: Record<string, string[]>;
  /** path -> list of project file paths that import it. */
  usedBy: Record<string, string[]>;
}

/** AI-generated project overview returned by /api/overview. */
export interface OverviewResult {
  summary: string;
  architecture: string;
  highlights: string[];
}

/** A single chat message in the AI chat panel. */
export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  /** True while the assistant reply is streaming/loading. */
  pending?: boolean;
  /** File paths used as context for this answer (for transparency). */
  sources?: string[];
}

/** AI-generated analysis of a single file, from /api/file. */
export interface FileAnalysis {
  purpose: string;
  responsibilities: string[];
}

/** The full in-memory representation of an uploaded project. */
export interface ProjectModel {
  name: string;
  files: ProjectFile[];
  fileCount: number;
  totalBytes: number;
  languages: LanguageStat[];
  /** Best-guess primary framework, e.g. "Next.js". "Unknown" if none. */
  framework: string;
  /** All frameworks/libraries we detected signals for. */
  frameworks: string[];
  tree: TreeNode;
  graph: ImportGraph;
  /** Number of files skipped by the ignore filter or size cap. */
  skippedCount: number;
}
