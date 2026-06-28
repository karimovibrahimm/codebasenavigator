"use client";

import { useEffect, useRef, useState } from "react";
import { useProject } from "./ProjectProvider";
import {
  buildMarkdownBundle,
  bundleFilename,
  downloadText,
} from "@/lib/exportBundle";

export default function ExportMenu() {
  const { project, overview } = useProject();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close the popover on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!project) return null;

  async function copy(mapOnly: boolean) {
    const text = buildMarkdownBundle(project!, { mapOnly, overview });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(mapOnly ? "map" : "full");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context) — fall back to a download.
      downloadText(bundleFilename(project!.name, mapOnly), text);
    }
  }

  function download(mapOnly: boolean) {
    const text = buildMarkdownBundle(project!, { mapOnly, overview });
    downloadText(bundleFilename(project!.name, mapOnly), text);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-line bg-bg px-2.5 py-1 text-xs font-medium text-[#c9d1d9] transition hover:border-accent hover:bg-bg-softer"
        title="Export this project as a single file for Cursor, Claude, etc."
      >
        <span>⬇ Export for AI</span>
        <span className="text-[9px] text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-lg border border-line bg-bg-soft shadow-xl">
          <p className="border-b border-line px-3 py-2 text-[10px] uppercase tracking-wider text-muted">
            Full bundle · {overview ? "summary + " : ""}tree + all files
          </p>
          <MenuItem onClick={() => copy(false)}>
            {copied === "full" ? "✓ Copied!" : "Copy to clipboard"}
          </MenuItem>
          <MenuItem onClick={() => download(false)}>Download .md</MenuItem>

          <p className="border-y border-line px-3 py-2 text-[10px] uppercase tracking-wider text-muted">
            Map only · {overview ? "summary + " : ""}structure, no code
          </p>
          <MenuItem onClick={() => copy(true)}>
            {copied === "map" ? "✓ Copied!" : "Copy file map"}
          </MenuItem>
          <MenuItem onClick={() => download(true)}>Download map .md</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-xs text-[#c9d1d9] transition hover:bg-bg-softer hover:text-[#e6edf3]"
    >
      {children}
    </button>
  );
}
