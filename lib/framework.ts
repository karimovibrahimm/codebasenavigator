import type { ProjectFile } from "./types";

interface DetectionResult {
  primary: string;
  all: string[];
}

/**
 * Heuristic framework/library detection. Reads package.json dependencies when
 * present, and falls back to signature files and import patterns. No AI.
 */
export function detectFrameworks(files: ProjectFile[]): DetectionResult {
  const detected = new Set<string>();
  const byPath = new Map(files.map((f) => [f.path.toLowerCase(), f]));

  // 1. package.json dependency signals (strongest)
  const pkg = files.find((f) => f.name === "package.json" && !f.path.includes("/"));
  let deps: Record<string, string> = {};
  if (pkg) {
    try {
      const json = JSON.parse(pkg.content);
      deps = { ...json.dependencies, ...json.devDependencies };
    } catch {
      /* ignore malformed package.json */
    }
  }

  const has = (name: string) => Object.prototype.hasOwnProperty.call(deps, name);

  if (has("next")) detected.add("Next.js");
  if (has("nuxt")) detected.add("Nuxt");
  if (has("@remix-run/react")) detected.add("Remix");
  if (has("gatsby")) detected.add("Gatsby");
  if (has("react") && !detected.has("Next.js") && !detected.has("Gatsby") && !detected.has("Remix")) {
    detected.add("React");
  }
  if (has("vue")) detected.add("Vue");
  if (has("svelte")) detected.add("Svelte");
  if (has("@angular/core")) detected.add("Angular");
  if (has("express")) detected.add("Express");
  if (has("fastify")) detected.add("Fastify");
  if (has("@nestjs/core")) detected.add("NestJS");
  if (has("koa")) detected.add("Koa");
  if (has("prisma") || has("@prisma/client")) detected.add("Prisma");
  if (has("mongoose")) detected.add("Mongoose");
  if (has("tailwindcss")) detected.add("Tailwind CSS");
  if (has("vite")) detected.add("Vite");

  // 2. Signature files (when no package.json or for non-JS stacks)
  const exists = (p: string) => byPath.has(p.toLowerCase());
  if (exists("requirements.txt") || exists("pyproject.toml")) {
    const usesDjango = files.some((f) => f.name === "manage.py") ||
      files.some((f) => /django/i.test(f.content) && f.ext === "py");
    const usesFlask = files.some((f) => /from flask import|import flask/i.test(f.content));
    const usesFastapi = files.some((f) => /from fastapi import|import fastapi/i.test(f.content));
    if (usesDjango) detected.add("Django");
    if (usesFlask) detected.add("Flask");
    if (usesFastapi) detected.add("FastAPI");
    if (!usesDjango && !usesFlask && !usesFastapi) detected.add("Python");
  }
  if (exists("go.mod")) detected.add("Go");
  if (exists("cargo.toml")) detected.add("Rust");
  if (exists("gemfile")) detected.add("Ruby on Rails");
  if (exists("dockerfile") || exists("docker-compose.yml")) detected.add("Docker");

  // 3. Pick a sensible primary (frontend framework first, then backend)
  const priority = [
    "Next.js", "Nuxt", "Remix", "Gatsby", "Angular", "Vue", "Svelte", "React",
    "Django", "FastAPI", "Flask", "NestJS", "Express", "Fastify", "Koa",
    "Ruby on Rails", "Go", "Rust", "Python",
  ];
  const primary = priority.find((p) => detected.has(p)) ?? "Unknown";

  return { primary, all: Array.from(detected) };
}
