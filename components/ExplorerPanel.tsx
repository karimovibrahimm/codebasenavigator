"use client";

import { useState } from "react";
import { useProject } from "./ProjectProvider";
import type { TreeNode } from "@/lib/types";

export default function ExplorerPanel() {
  const { project, reset } = useProject();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-bg-soft">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
          {project ? project.name : "Explorer"}
        </span>
        {project && (
          <button
            onClick={reset}
            className="rounded px-1.5 py-0.5 text-[11px] text-muted transition hover:bg-bg-softer hover:text-[#e6edf3]"
            title="Load a different project"
          >
            Change
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {project ? (
          <TreeView nodes={project.tree.children ?? []} depth={0} />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted">
            No project loaded yet.
          </div>
        )}
      </div>
    </aside>
  );
}

function TreeView({ nodes, depth }: { nodes: TreeNode[]; depth: number }) {
  return (
    <ul>
      {nodes.map((node) => (
        <TreeRow key={node.path} node={node} depth={depth} />
      ))}
    </ul>
  );
}

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const { openFile, selectedPath, view } = useProject();
  const [open, setOpen] = useState(depth < 1);
  const pad = { paddingLeft: `${8 + depth * 12}px` };

  if (node.type === "folder") {
    return (
      <li>
        <button
          onClick={() => setOpen((o) => !o)}
          style={pad}
          className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs text-[#c9d1d9] transition hover:bg-bg-softer"
        >
          <span className="w-3 shrink-0 text-[9px] text-muted">
            {open ? "▼" : "▶"}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children && (
          <TreeView nodes={node.children} depth={depth + 1} />
        )}
      </li>
    );
  }

  const isSelected = view === "file" && selectedPath === node.path;
  return (
    <li>
      <button
        onClick={() => openFile(node.path)}
        style={pad}
        className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs transition ${
          isSelected
            ? "bg-accent-soft/20 text-accent"
            : "text-[#8b949e] hover:bg-bg-softer hover:text-[#c9d1d9]"
        }`}
      >
        <span className="w-3 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}
