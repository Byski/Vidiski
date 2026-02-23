"use client";

type RenderProgressProps = {
  progress: number;
  status: string;
};

export const RenderProgress = ({ progress, status }: RenderProgressProps) => {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Render Status</p>
        <p className="text-xs text-slate-200">{status}</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
        <div
          className="h-2 rounded bg-gradient-to-r from-blue-400 to-cyan-300 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">{progress}% complete</p>
    </div>
  );
};
