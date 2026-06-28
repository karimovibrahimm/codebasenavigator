"use client";

import { useEffect, useRef, useState } from "react";
import { useProject } from "./ProjectProvider";

const SUGGESTIONS = [
  "What does this project do?",
  "How does authentication work?",
  "Where are the main entry points?",
  "Explain the routing.",
];

export default function ChatPanel() {
  const { project, chatMessages, chatLoading, sendChat, openFile } = useProject();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const submit = (text: string) => {
    const q = text.trim();
    if (!q || chatLoading) return;
    setInput("");
    void sendChat(q);
  };

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-bg-soft">
      <div className="border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
        AI Chat
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        {chatMessages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted">
              {project
                ? "Ask anything about this project."
                : "Load a project to start chatting."}
            </p>
            {project &&
              SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="block w-full rounded-lg border border-line bg-bg px-3 py-2 text-left text-xs text-[#c9d1d9] transition hover:border-accent hover:bg-bg-softer"
                >
                  {s}
                </button>
              ))}
          </div>
        )}

        {chatMessages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={`max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-accent-soft text-white"
                  : "border border-line bg-bg text-[#c9d1d9]"
              }`}
            >
              {m.pending ? (
                <span className="animate-pulse text-muted">Thinking…</span>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 border-t border-line pt-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {m.sources.map((s) => (
                      <button
                        key={s}
                        onClick={() => openFile(s)}
                        className="rounded bg-bg-softer px-1.5 py-0.5 font-mono text-[10px] text-accent hover:underline"
                        title={s}
                      >
                        {s.split("/").pop()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="border-t border-line p-2"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            disabled={!project || chatLoading}
            rows={1}
            placeholder={project ? "Ask a question…" : "Load a project first"}
            className="max-h-28 min-h-[36px] flex-1 resize-none rounded-lg border border-line bg-bg px-3 py-2 text-xs text-[#e6edf3] placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!project || chatLoading || !input.trim()}
            className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
