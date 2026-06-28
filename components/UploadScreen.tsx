"use client";

import { useEffect, useRef, useState } from "react";
import { useProject } from "./ProjectProvider";

export default function UploadScreen() {
  const { loadProject, loadGithub, loadSample, loading, progress, error } =
    useProject();
  const inputRef = useRef<HTMLInputElement>(null);
  const [repoUrl, setRepoUrl] = useState("");

  // webkitdirectory / directory are non-standard attributes; set them manually.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setAttribute("webkitdirectory", "");
      inputRef.current.setAttribute("directory", "");
    }
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-xl bg-bg-softer text-2xl">
          🧭
        </div>
        <h1 className="mb-2 text-xl font-semibold tracking-tight text-[#e6edf3]">
          Understand any codebase
        </h1>
        <p className="mb-6 text-sm text-muted">
          Pick a project folder or paste a GitHub repo. Codebase Navigator reads
          the source, maps the architecture, and lets you ask questions about it.
        </p>

        <label
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg-soft px-6 py-10 transition hover:border-accent hover:bg-bg-softer ${
            loading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                void loadProject(e.target.files);
              }
            }}
          />
          <span className="text-sm font-medium text-[#e6edf3]">
            {loading ? "Analyzing…" : "Select project folder"}
          </span>
          <span className="mt-1 text-xs text-muted">
            Everything runs locally in your browser
          </span>
        </label>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[11px] uppercase tracking-wider text-muted">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) void loadGithub(repoUrl);
          }}
        >
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
            placeholder="github.com/owner/repo"
            spellCheck={false}
            className="flex-1 rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-[#c9d1d9] placeholder:text-muted outline-none transition focus:border-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !repoUrl.trim()}
            className="rounded-lg border border-line bg-bg-soft px-4 py-2.5 text-sm font-medium text-[#c9d1d9] transition hover:border-accent hover:bg-bg-softer disabled:opacity-50"
          >
            Import
          </button>
        </form>
        <p className="mt-2 text-[11px] text-muted">
          Public repos only. Reads the default branch (or paste a /tree/branch URL).
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[11px] uppercase tracking-wider text-muted">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <button
          onClick={() => loadSample()}
          disabled={loading}
          className="mt-4 w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm font-medium text-[#c9d1d9] transition hover:border-accent hover:bg-bg-softer disabled:opacity-50"
        >
          Try a sample project →
        </button>

        {loading && progress && (
          <p className="mt-4 text-xs text-muted">
            Reading files… {progress.processed}/{progress.total}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <p className="mt-6 text-[11px] text-muted">
          node_modules, build output, lockfiles and binaries are skipped
          automatically.
        </p>
      </div>
    </div>
  );
}
