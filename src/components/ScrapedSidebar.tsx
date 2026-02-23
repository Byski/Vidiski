"use client";

import type { ScrapedContent } from "@/src/lib/video-types";

type ScrapedSidebarProps = {
  scraped: ScrapedContent | null;
  onInsertText: (text: string) => void;
};

export const ScrapedSidebar = ({ scraped, onInsertText }: ScrapedSidebarProps) => {
  if (!scraped) {
    return (
      <aside className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-white">Source content</h3>
        <p className="mt-2 text-sm text-slate-400">Generate a video first to load scraped headlines and copy.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-white">Source content</h3>
      <p className="mt-1 text-xs text-slate-400">Click any line to copy it into your active scene field.</p>
      <div className="mt-3 max-h-[520px] space-y-2 overflow-auto pr-1">
        {scraped.elements.map((element, index) => (
          <button
            type="button"
            key={`${element.type}-${index}`}
            onClick={() => onInsertText(element.content)}
            className="block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-slate-500"
            title={`Insert ${element.type}`}
          >
            <span className="mr-2 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
              {element.type}
            </span>
            {element.content}
          </button>
        ))}
      </div>
    </aside>
  );
};
