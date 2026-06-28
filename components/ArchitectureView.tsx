"use client";

import { useEffect, useMemo } from "react";
import { useProject } from "./ProjectProvider";
import { buildArchitecture } from "@/lib/architecture";

export default function ArchitectureView() {
  const {
    project,
    selectedCategory,
    openArchitecture,
    openFile,
    archDescriptions,
    describeCategory,
  } = useProject();

  const categories = useMemo(
    () => (project ? buildArchitecture(project) : []),
    [project]
  );

  const active = categories.find((c) => c.key === selectedCategory) ?? null;

  // Trigger AI description when a category is opened.
  useEffect(() => {
    if (!active || !project) return;
    const snippets = active.files.slice(0, 8).map((path) => {
      const f = project.files.find((file) => file.path === path);
      return { path, snippet: f?.content.slice(0, 600) ?? "" };
    });
    describeCategory(active.key, active.label, snippets);
  }, [active, project, describeCategory]);

  if (!project) return null;

  if (!active) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-[#e6edf3]">
          Architecture
        </h1>
        <p className="mb-5 text-sm text-muted">
          The project grouped into architectural layers. Click a card to learn more.
        </p>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            No recognizable architecture layers were detected.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => openArchitecture(c.key)}
                className="group rounded-lg border border-line bg-bg-soft p-4 text-left transition hover:border-accent hover:bg-bg-softer"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-muted">
                    {c.files.length}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#e6edf3]">{c.label}</div>
                <div className="mt-0.5 text-xs text-muted">{c.tagline}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const entry = archDescriptions[active.key];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button
        onClick={() => openArchitecture()}
        className="mb-4 text-xs text-accent hover:underline"
      >
        ← All layers
      </button>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{active.icon}</span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#e6edf3]">
            {active.label}
          </h1>
          <p className="text-xs text-muted">
            {active.files.length} files · {active.tagline}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-accent-soft/40 bg-accent-soft/10 p-4">
        {entry?.loading && (
          <p className="animate-pulse text-sm text-muted">
            Explaining this layer…
          </p>
        )}
        {entry?.error && <p className="text-sm text-red-300">{entry.error}</p>}
        {entry?.data && (
          <p className="text-sm leading-relaxed text-[#e6edf3]">{entry.data}</p>
        )}
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        Related files
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-bg-soft">
        {active.files.map((p) => (
          <li key={p}>
            <button
              onClick={() => openFile(p)}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-bg-softer"
            >
              <span className="truncate font-mono text-xs text-[#c9d1d9]">{p}</span>
              <span className="ml-2 shrink-0 text-[11px] text-accent">open →</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
