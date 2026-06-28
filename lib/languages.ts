/** Maps a lowercased file extension to a human-readable language label. */
const EXT_TO_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  php: "PHP",
  cs: "C#",
  c: "C",
  h: "C",
  cpp: "C++",
  cc: "C++",
  hpp: "C++",
  swift: "Swift",
  scala: "Scala",
  sh: "Shell",
  bash: "Shell",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  vue: "Vue",
  svelte: "Svelte",
  json: "JSON",
  yml: "YAML",
  yaml: "YAML",
  toml: "TOML",
  md: "Markdown",
  mdx: "Markdown",
  graphql: "GraphQL",
  gql: "GraphQL",
  prisma: "Prisma",
  dockerfile: "Docker",
};

export function languageForFile(name: string, ext: string): string {
  if (name.toLowerCase() === "dockerfile") return "Docker";
  return EXT_TO_LANGUAGE[ext] ?? "Other";
}

/** Extensions we treat as readable source/text and will load content for. */
export const TEXT_EXTENSIONS = new Set([
  ...Object.keys(EXT_TO_LANGUAGE),
  "txt",
  "env",
  "gitignore",
  "npmrc",
  "editorconfig",
  "xml",
  "ini",
  "conf",
]);
