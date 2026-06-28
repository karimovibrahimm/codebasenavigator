import type { ProjectFile, ProjectModel } from "./types";

export interface ArchitectureCategory {
  key: string;
  label: string;
  icon: string;
  tagline: string;
  files: string[];
}

interface CategoryDef {
  key: string;
  label: string;
  icon: string;
  tagline: string;
  /** Returns true if the file belongs to this category. */
  match: (file: ProjectFile) => boolean;
}

const FRONTEND_EXTS = new Set(["tsx", "jsx", "vue", "svelte", "css", "scss", "sass", "less"]);
const pathHas = (f: ProjectFile, ...needles: string[]) => {
  const p = f.path.toLowerCase();
  return needles.some((n) => p.includes(n));
};
const contentHas = (f: ProjectFile, re: RegExp) => re.test(f.content);

const DEFINITIONS: CategoryDef[] = [
  {
    key: "frontend",
    label: "Frontend",
    icon: "🎨",
    tagline: "UI components, pages and styles",
    match: (f) =>
      (FRONTEND_EXTS.has(f.ext) || pathHas(f, "/components/", "components/", "/pages/", "/views/", "/ui/")) &&
      !pathHas(f, "/api/", "api/", "server", "route.ts", "route.js"),
  },
  {
    key: "api",
    label: "API",
    icon: "🔌",
    tagline: "Endpoints and request handlers",
    match: (f) =>
      pathHas(f, "/api/", "api/", "/routes/", "routes/", "controller", "endpoint", "graphql") ||
      /route\.(ts|js)$/.test(f.name),
  },
  {
    key: "backend",
    label: "Backend",
    icon: "⚙️",
    tagline: "Server logic and services",
    match: (f) =>
      pathHas(f, "/server/", "server/", "/services/", "services/", "/middleware/", "middleware") ||
      contentHas(f, /\b(express|fastify|createServer|app\.listen|@nestjs)\b/),
  },
  {
    key: "auth",
    label: "Authentication",
    icon: "🔐",
    tagline: "Login, sessions and access control",
    match: (f) =>
      pathHas(f, "auth", "login", "session", "jwt", "passport") ||
      contentHas(f, /\b(jsonwebtoken|jwt\.sign|bcrypt|passport|getServerSession|next-auth)\b/i),
  },
  {
    key: "database",
    label: "Database",
    icon: "🗄️",
    tagline: "Models, schema and data access",
    match: (f) =>
      f.ext === "prisma" ||
      f.ext === "sql" ||
      pathHas(f, "/models/", "models/", "/db/", "schema", "migration", "entities", "repository", "prisma") ||
      contentHas(f, /\b(mongoose|prisma|createConnection|typeorm|sequelize|knex)\b/),
  },
  {
    key: "utilities",
    label: "Utilities",
    icon: "🧰",
    tagline: "Helpers, config and shared code",
    match: (f) =>
      pathHas(f, "/utils/", "utils/", "/helpers/", "helpers/", "/lib/", "/config/", "constants", "config."),
  },
];

/** Buckets project files into fixed architecture categories. */
export function buildArchitecture(model: ProjectModel): ArchitectureCategory[] {
  const result: ArchitectureCategory[] = [];
  for (const def of DEFINITIONS) {
    const files = model.files.filter(def.match).map((f) => f.path);
    if (files.length === 0) continue;
    result.push({
      key: def.key,
      label: def.label,
      icon: def.icon,
      tagline: def.tagline,
      files,
    });
  }
  return result;
}
