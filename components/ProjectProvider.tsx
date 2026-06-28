"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { parseProject, buildModelFromRaw, type ParseProgress } from "@/lib/parseProject";
import { SAMPLE_PROJECT } from "@/lib/sampleProject";
import { buildOverviewContext } from "@/lib/context";
import {
  fetchOverview,
  fetchFileAnalysis,
  fetchArchitecture,
  fetchChat,
  fetchGithubProject,
} from "@/lib/aiClient";
import { retrieveRelevantFiles } from "@/lib/retrieve";
import type { ChatMsg, FileAnalysis, OverviewResult, ProjectModel } from "@/lib/types";

export type CenterView = "overview" | "file" | "architecture";

export interface FileAnalysisEntry {
  loading: boolean;
  error: string | null;
  data: FileAnalysis | null;
}

export interface ArchEntry {
  loading: boolean;
  error: string | null;
  data: string | null;
}

interface ProjectState {
  project: ProjectModel | null;
  loading: boolean;
  progress: ParseProgress | null;
  error: string | null;

  overview: OverviewResult | null;
  overviewLoading: boolean;
  overviewError: string | null;

  fileAnalyses: Record<string, FileAnalysisEntry>;
  archDescriptions: Record<string, ArchEntry>;

  chatMessages: ChatMsg[];
  chatLoading: boolean;

  view: CenterView;
  selectedPath: string | null;
  selectedCategory: string | null;

  loadProject: (files: FileList) => Promise<void>;
  loadGithub: (url: string) => Promise<void>;
  loadSample: () => void;
  reset: () => void;
  openFile: (path: string) => void;
  openOverview: () => void;
  openArchitecture: (category?: string) => void;
  describeCategory: (
    key: string,
    label: string,
    files: { path: string; snippet: string }[]
  ) => void;
  sendChat: (question: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectState | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<ProjectModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [fileAnalyses, setFileAnalyses] = useState<Record<string, FileAnalysisEntry>>({});
  const [archDescriptions, setArchDescriptions] = useState<Record<string, ArchEntry>>({});

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [view, setView] = useState<CenterView>("overview");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const generateOverview = useCallback(async (model: ProjectModel) => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const result = await fetchOverview(buildOverviewContext(model));
      setOverview(result);
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : "Overview failed.");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  /** Activates a parsed model: clears caches, shows the overview, kicks off AI. */
  const applyProject = useCallback(
    (model: ProjectModel) => {
      setOverview(null);
      setOverviewError(null);
      setFileAnalyses({});
      setArchDescriptions({});
      setChatMessages([]);
      setProject(model);
      setView("overview");
      setSelectedPath(null);
      setSelectedCategory(null);
      void generateOverview(model);
    },
    [generateOverview]
  );

  const loadProject = useCallback(
    async (files: FileList) => {
      setLoading(true);
      setError(null);
      setProgress(null);
      try {
        const model = await parseProject(files, setProgress);
        if (model.fileCount === 0) {
          throw new Error(
            "No readable source files found in that folder. Did you pick the right one?"
          );
        }
        applyProject(model);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to read project.");
      } finally {
        setLoading(false);
      }
    },
    [applyProject]
  );

  const loadGithub = useCallback(
    async (url: string) => {
      if (!url.trim()) return;
      setLoading(true);
      setError(null);
      setProgress(null);
      try {
        const { name, files } = await fetchGithubProject(url);
        if (files.length === 0) {
          throw new Error("No readable source files found in that repository.");
        }
        applyProject(buildModelFromRaw(name, files));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to import repository.");
      } finally {
        setLoading(false);
      }
    },
    [applyProject]
  );

  const loadSample = useCallback(() => {
    setError(null);
    const model = buildModelFromRaw(SAMPLE_PROJECT.name, SAMPLE_PROJECT.files);
    applyProject(model);
  }, [applyProject]);

  const reset = useCallback(() => {
    setProject(null);
    setError(null);
    setProgress(null);
    setOverview(null);
    setOverviewError(null);
    setFileAnalyses({});
    setArchDescriptions({});
    setChatMessages([]);
    setSelectedPath(null);
    setSelectedCategory(null);
    setView("overview");
  }, []);

  const analyzeFile = useCallback(
    async (path: string) => {
      const file = project?.files.find((f) => f.path === path);
      if (!file) return;
      setFileAnalyses((prev) => ({
        ...prev,
        [path]: { loading: true, error: null, data: null },
      }));
      try {
        const data = await fetchFileAnalysis(file.path, file.language, file.content);
        setFileAnalyses((prev) => ({
          ...prev,
          [path]: { loading: false, error: null, data },
        }));
      } catch (e) {
        setFileAnalyses((prev) => ({
          ...prev,
          [path]: {
            loading: false,
            error: e instanceof Error ? e.message : "Analysis failed.",
            data: null,
          },
        }));
      }
    },
    [project]
  );

  const openFile = useCallback(
    (path: string) => {
      setSelectedPath(path);
      setView("file");
      setFileAnalyses((prev) => {
        if (prev[path]?.data || prev[path]?.loading) return prev;
        void analyzeFile(path);
        return prev;
      });
    },
    [analyzeFile]
  );

  const openOverview = useCallback(() => {
    setView("overview");
  }, []);

  const openArchitecture = useCallback((category?: string) => {
    setSelectedCategory(category ?? null);
    setView("architecture");
  }, []);

  const describeCategory = useCallback(
    (key: string, label: string, files: { path: string; snippet: string }[]) => {
      setArchDescriptions((prev) => {
        if (prev[key]?.data || prev[key]?.loading) return prev;
        void (async () => {
          try {
            const { description } = await fetchArchitecture(label, files);
            setArchDescriptions((p) => ({
              ...p,
              [key]: { loading: false, error: null, data: description },
            }));
          } catch (e) {
            setArchDescriptions((p) => ({
              ...p,
              [key]: {
                loading: false,
                error: e instanceof Error ? e.message : "Failed.",
                data: null,
              },
            }));
          }
        })();
        return { ...prev, [key]: { loading: true, error: null, data: null } };
      });
    },
    []
  );

  const sendChat = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || !project || chatLoading) return;

      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const retrieved = retrieveRelevantFiles(project, q, 5);

      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: q },
        { role: "assistant", content: "", pending: true },
      ]);
      setChatLoading(true);

      try {
        const { answer } = await fetchChat({
          question: q,
          history,
          files: retrieved,
          meta: {
            name: project.name,
            framework: project.framework,
            languages: project.languages.map((l) => l.language).join(", "),
          },
        });
        setChatMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: answer,
            sources: retrieved.map((r) => r.path),
          };
          return next;
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Chat request failed.";
        setChatMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: `⚠️ ${msg}`,
          };
          return next;
        });
      } finally {
        setChatLoading(false);
      }
    },
    [project, chatMessages, chatLoading]
  );

  const value = useMemo<ProjectState>(
    () => ({
      project,
      loading,
      progress,
      error,
      overview,
      overviewLoading,
      overviewError,
      fileAnalyses,
      archDescriptions,
      chatMessages,
      chatLoading,
      view,
      selectedPath,
      selectedCategory,
      loadProject,
      loadGithub,
      loadSample,
      reset,
      openFile,
      openOverview,
      openArchitecture,
      describeCategory,
      sendChat,
    }),
    [
      project,
      loading,
      progress,
      error,
      overview,
      overviewLoading,
      overviewError,
      fileAnalyses,
      archDescriptions,
      chatMessages,
      chatLoading,
      view,
      selectedPath,
      selectedCategory,
      loadProject,
      loadGithub,
      loadSample,
      reset,
      openFile,
      openOverview,
      openArchitecture,
      describeCategory,
      sendChat,
    ]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectState {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
