"use client";

import { useProject } from "./ProjectProvider";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OverviewView() {
  const { project, overview, overviewLoading, overviewError } = useProject();
  if (!project) return null;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e6edf3]">
          {project.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {project.framework !== "Unknown"
            ? `Detected ${project.framework} project`
            : "Project overview"}
        </p>
      </div>

      {/* AI summary banner */}
      <div className="mb-6 rounded-lg border border-accent-soft/40 bg-accent-soft/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-accent">
            AI Summary
          </h2>
        </div>
        {overviewLoading && (
          <p className="animate-pulse text-sm text-muted">
            Reading the code and writing a summary…
          </p>
        )}
        {overviewError && (
          <p className="text-sm text-red-300">{overviewError}</p>
        )}
        {!overviewLoading && !overviewError && overview && (
          <>
            <p className="text-sm leading-relaxed text-[#e6edf3]">
              {overview.summary || "No summary returned."}
            </p>
            {overview.highlights.length > 0 && (
              <ul className="mt-3 space-y-1">
                {overview.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[#c9d1d9]">
                    <span className="text-accent">▸</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Files" value={project.fileCount.toString()} />
        <Stat label="Languages" value={project.languages.length.toString()} />
        <Stat label="Size" value={formatBytes(project.totalBytes)} />
        <Stat label="Skipped" value={project.skippedCount.toString()} />
      </div>

      {/* Framework + languages */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel title="Frameworks & libraries">
          {project.frameworks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {project.frameworks.map((fw) => (
                <span
                  key={fw}
                  className="rounded-full border border-line bg-bg px-2.5 py-1 text-xs text-[#c9d1d9]"
                >
                  {fw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No frameworks detected.</p>
          )}
        </Panel>

        <Panel title="Languages">
          <ul className="space-y-1.5">
            {project.languages.slice(0, 6).map((lang) => (
              <li
                key={lang.language}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-[#c9d1d9]">{lang.language}</span>
                <span className="text-muted">{lang.files} files</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* AI architecture estimate */}
      <Panel title="Estimated architecture" className="mt-3">
        {overviewLoading && (
          <p className="animate-pulse text-xs text-muted">Analyzing…</p>
        )}
        {!overviewLoading && overview?.architecture && (
          <p className="text-sm leading-relaxed text-[#c9d1d9]">
            {overview.architecture}
          </p>
        )}
        {!overviewLoading && !overview?.architecture && (
          <p className="text-xs text-muted">No architecture estimate available.</p>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-soft px-3 py-3">
      <div className="text-lg font-semibold text-[#e6edf3]">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-bg-soft p-4 ${className}`}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {children}
    </div>
  );
}
