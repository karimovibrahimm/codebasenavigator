"use client";

import { ProjectProvider, useProject } from "./ProjectProvider";
import ExplorerPanel from "./ExplorerPanel";
import CenterPanel from "./CenterPanel";
import ChatPanel from "./ChatPanel";
import UploadScreen from "./UploadScreen";
import ExportMenu from "./ExportMenu";

function Shell() {
  const { project } = useProject();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-bg-soft px-4">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded bg-accent-soft text-xs font-bold text-white">
            CN
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Codebase Navigator
          </span>
        </div>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
          MVP Demo
        </span>
        <div className="ml-auto">
          <ExportMenu />
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <ExplorerPanel />
        {project ? (
          <CenterPanel />
        ) : (
          <main className="flex min-w-0 flex-1 flex-col bg-bg">
            <UploadScreen />
          </main>
        )}
        <ChatPanel />
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <ProjectProvider>
      <Shell />
    </ProjectProvider>
  );
}
