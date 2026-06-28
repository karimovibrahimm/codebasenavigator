/** Directory names that are never useful for understanding a project. */
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".nuxt",
  "dist",
  "build",
  "out",
  "coverage",
  ".turbo",
  ".cache",
  ".vercel",
  ".svelte-kit",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  "bin",
  "obj",
  ".idea",
  ".vscode",
  ".DS_Store",
]);

/** Exact file names to skip. */
const IGNORED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "composer.lock",
  "poetry.lock",
  "cargo.lock",
  ".ds_store",
]);

/** File extensions that are binary / not worth reading as source. */
const IGNORED_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "svg", "bmp", "avif",
  "mp4", "mov", "avi", "webm", "mp3", "wav", "ogg",
  "woff", "woff2", "ttf", "otf", "eot",
  "pdf", "zip", "gz", "tar", "rar", "7z",
  "exe", "dll", "so", "dylib", "bin", "wasm",
  "lockb", "map",
]);

/** True if any path segment is an ignored directory. */
export function isInIgnoredDir(relativePath: string): boolean {
  return relativePath
    .split("/")
    .some((segment) => IGNORED_DIRS.has(segment));
}

/** Decide whether a file should be skipped entirely. */
export function shouldIgnore(relativePath: string, name: string, ext: string): boolean {
  if (isInIgnoredDir(relativePath)) return true;
  if (IGNORED_FILES.has(name.toLowerCase())) return true;
  if (IGNORED_EXTENSIONS.has(ext)) return true;
  return false;
}
