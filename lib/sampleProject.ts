/**
 * A small, self-consistent example codebase used for the "Try a sample project"
 * button, so the demo works instantly without uploading anything. It is a
 * Next.js blog with JWT auth and a Prisma data layer.
 */
export const SAMPLE_PROJECT: { name: string; files: { path: string; content: string }[] } = {
  name: "inkwell-blog",
  files: [
    {
      path: "package.json",
      content: `{
  "name": "inkwell-blog",
  "version": "1.0.0",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": { "prisma": "^5.0.0", "tailwindcss": "^3.4.0" }
}
`,
    },
    {
      path: "README.md",
      content: `# Inkwell Blog

A minimal blogging platform. Readers browse published articles; authenticated
admins can create and publish new posts.

- **Frontend:** Next.js App Router + Tailwind
- **Auth:** email/password with JWT sessions
- **Data:** Prisma + SQLite
`,
    },
    {
      path: "prisma/schema.prisma",
      content: `datasource db { provider = "sqlite"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  password String
  role     String  @default("reader")
  posts    Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
`,
    },
    {
      path: "lib/db.ts",
      content: `import { PrismaClient } from "@prisma/client";

// Reuse a single Prisma client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`,
    },
    {
      path: "lib/auth.ts",
      content: `import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function signToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  return ok ? user : null;
}
`,
    },
    {
      path: "middleware.ts",
      content: `import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

// Protect /admin routes — require a valid JWT with the admin role.
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = req.cookies.get("session")?.value ?? "";
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
`,
    },
    {
      path: "app/api/login/route.ts",
      content: `import { NextResponse } from "next/server";
import { authenticate, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await authenticate(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = signToken(user.id, user.role);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, { httpOnly: true, path: "/" });
  return res;
}
`,
    },
    {
      path: "app/api/posts/route.ts",
      content: `import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// List published posts.
export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

// Create a post (admins only).
export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/session=([^;]+)/)?.[1] ?? "";
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { title, body, published } = await req.json();
  const post = await prisma.post.create({
    data: { title, body, published: !!published, authorId: payload.userId },
  });
  return NextResponse.json(post, { status: 201 });
}
`,
    },
    {
      path: "app/page.tsx",
      content: `import { prisma } from "@/lib/db";
import PostCard from "@/components/PostCard";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Inkwell</h1>
      <div className="space-y-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </main>
  );
}
`,
    },
    {
      path: "app/admin/page.tsx",
      content: `"use client";
import { useState } from "react";

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function publish() {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, published: true }),
    });
    setTitle("");
    setBody("");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">New Post</h1>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" />
      <button onClick={publish}>Publish</button>
    </main>
  );
}
`,
    },
    {
      path: "components/PostCard.tsx",
      content: `interface Post {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-lg border p-4">
      <h2 className="text-xl font-semibold">{post.title}</h2>
      <p className="mt-2 text-gray-600">{post.body.slice(0, 160)}…</p>
    </article>
  );
}
`,
    },
    {
      path: "lib/format.ts",
      content: `// Small date helper used across the UI.
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
`,
    },
  ],
};
