"use client";

import { useMemo } from "react";
import { useProject } from "./ProjectProvider";
import { parseExports } from "@/lib/exports";

export default function FileView() {
  const { project, selectedPath, fileAnalyses, openFile } = useProject();

  const file = useMemo(
    () => project?.files.find((f) => f.path === selectedPath) ?? null,
    [project, selectedPath]
  );

  if (!project || !file) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted">
        Select a file from the explorer.
      </div>
    );
  }

  const analysis = selectedPath ? fileAnalyses[selectedPath] : undefined;
  const exportsList = parseExports(file.content, file.ext);
  const dependsOn = project.graph.dependsOn[file.path] ?? [];
  const usedBy = project.graph.usedBy[file.path] ?? [];
  const lines = file.content.split("\n");

  return (
    <div className="flex h-full min-h-0">
      {/* Code */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-line">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3 text-xs">
          <span className="font-mono text-[#c9d1d9]">{file.path}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{file.language}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{lines.length} lines</span>
          {file.truncated && (
            <span className="rounded bg-bg-softer px-1.5 py-0.5 text-[10px] text-muted">
              truncated
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <pre className="flex font-mono text-[12px] leading-5">
            <code className="select-none border-r border-line px-3 py-2 text-right text-muted">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </code>
            <code className="px-3 py-2 text-[#c9d1d9]">
              {lines.map((line, i) => (
                <div key={i} className="whitespace-pre">
                  {line || " "}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>

      {/* Insights */}
      <div className="flex w-72 shrink-0 flex-col overflow-auto bg-bg-soft">
        <div className="flex h-9 shrink-0 items-center border-b border-line px-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Insights
        </div>
        <div className="space-y-4 p-3">
          <Section title="Purpose">
            {analysis?.loading && (
              <p className="animate-pulse text-xs text-muted">Analyzing file…</p>
            )}
            {analysis?.error && (
              <p className="text-xs text-red-300">{analysis.error}</p>
            )}
            {analysis?.data && (
              <p className="text-xs leading-relaxed text-[#c9d1d9]">
                {analysis.data.purpose}
              </p>
            )}
          </Section>

          {analysis?.data && analysis.data.responsibilities.length > 0 && (
            <Section title="Responsibilities">
              <ul className="space-y-1">
                {analysis.data.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-[#c9d1d9]">
                    <span className="text-accent">▸</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={`Exports (${exportsList.length})`}>
            {exportsList.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {exportsList.map((e) => (
                  <span
                    key={e}
                    className="rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-[#c9d1d9]"
                  >
                    {e}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No exports detected.</p>
            )}
          </Section>

          <Section title={`Depends on (${dependsOn.length})`}>
            <FileLinks paths={dependsOn} onOpen={openFile} empty="No internal imports." />
          </Section>

          <Section title={`Used by (${usedBy.length})`}>
            <FileLinks paths={usedBy} onOpen={openFile} empty="No files import this." />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FileLinks({
  paths,
  onOpen,
  empty,
}: {
  paths: string[];
  onOpen: (path: string) => void;
  empty: string;
}) {
  if (paths.length === 0) {
    return <p className="text-xs text-muted">{empty}</p>;
  }
  return (
    <ul className="space-y-0.5">
      {paths.map((p) => (
        <li key={p}>
          <button
            onClick={() => onOpen(p)}
            className="w-full truncate text-left font-mono text-[11px] text-accent hover:underline"
            title={p}
          >
            {p.split("/").pop()}
          </button>
        </li>
      ))}
    </ul>
  );
}
