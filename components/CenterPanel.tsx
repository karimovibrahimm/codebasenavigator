"use client";

import { useProject } from "./ProjectProvider";
import OverviewView from "./OverviewView";
import FileView from "./FileView";
import ArchitectureView from "./ArchitectureView";

export default function CenterPanel() {
  const { project, view, openOverview, openArchitecture } = useProject();

  if (!project) return null;

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      {/* Tab bar */}
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-line px-3">
        <Tab label="Overview" active={view === "overview"} onClick={openOverview} />
        <Tab
          label="Architecture"
          active={view === "architecture"}
          onClick={() => openArchitecture()}
        />
        {view === "file" && <Tab label="File" active onClick={() => {}} />}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {view === "overview" && <OverviewView />}
        {view === "file" && <FileView />}
        {view === "architecture" && <ArchitectureView />}
      </div>
    </main>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-bg-softer text-[#e6edf3]"
          : "text-muted hover:bg-bg-soft hover:text-[#c9d1d9]"
      }`}
    >
      {label}
    </button>
  );
}
