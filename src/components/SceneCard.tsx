"use client";

import { useMemo, useState } from "react";
import type { VideoScene } from "@/src/lib/video-types";
import { ANIMATION_STYLES, ANIMATION_STYLE_LABELS } from "@/src/lib/animation-presets";

type SceneCardProps = {
  scene: VideoScene;
  index: number;
  busy: boolean;
  onMainChange: (value: string) => void;
  onSubChange: (value: string) => void;
  onAddBullet: () => void;
  onBulletChange: (bulletIndex: number, value: string) => void;
  onRemoveBullet: (bulletIndex: number) => void;
  onMoveBullet: (from: number, to: number) => void;
  onAnimationStyleChange: (value: VideoScene["animation_style"]) => void;
  onEnhance: (instruction: string) => void;
  onPreviewScene: () => void;
};

const labels: Record<VideoScene["type"], string> = {
  pain: "Pain / Problem",
  solution: "Solution Reveal",
  benefits: "Benefits",
  cta: "CTA"
};

export const SceneCard = ({
  scene,
  index,
  busy,
  onMainChange,
  onSubChange,
  onAddBullet,
  onBulletChange,
  onRemoveBullet,
  onMoveBullet,
  onAnimationStyleChange,
  onEnhance,
  onPreviewScene
}: SceneCardProps) => {
  const [instruction, setInstruction] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const durationLabel = useMemo(() => `${(scene.duration / 30).toFixed(0)}s`, [scene.duration]);

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Scene {index + 1}</p>
          <h3 className="text-lg font-semibold text-white">{labels[scene.type]}</h3>
          <p className="text-xs text-slate-400">{durationLabel}</p>
        </div>
        <button
          type="button"
          onClick={onPreviewScene}
          className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
        >
          Preview Scene
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Preview placeholder</p>
        <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-100">{scene.main_text}</p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Main text</label>
        <textarea
          value={scene.main_text}
          onChange={(event) => onMainChange(event.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
        />

        <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Sub text</label>
        <textarea
          value={scene.sub_text}
          onChange={(event) => onSubChange(event.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
        />

        <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
          Animation style
        </label>
        <select
          value={scene.animation_style ?? "smooth-rise"}
          onChange={(event) => onAnimationStyleChange(event.target.value as VideoScene["animation_style"])}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
        >
          {ANIMATION_STYLES.map((style) => (
            <option key={style} value={style}>
              {ANIMATION_STYLE_LABELS[style]}
            </option>
          ))}
        </select>

        {scene.type === "benefits" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bullets</p>
              <button
                type="button"
                onClick={onAddBullet}
                className="rounded-lg border border-emerald-500/60 px-2 py-1 text-xs font-semibold text-emerald-300 hover:border-emerald-300 hover:text-emerald-100"
              >
                + Add bullet
              </button>
            </div>
            {scene.bullets.map((bullet, bulletIndex) => (
              <div
                key={`${scene.type}-${bulletIndex}`}
                draggable
                onDragStart={() => setDragIndex(bulletIndex)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === bulletIndex) return;
                  onMoveBullet(dragIndex, bulletIndex);
                  setDragIndex(null);
                }}
                className="flex items-center gap-2"
              >
                <span className="cursor-grab text-slate-400">::</span>
                <input
                  value={bullet}
                  onChange={(event) => onBulletChange(bulletIndex, event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => onRemoveBullet(bulletIndex)}
                  className="rounded-lg border border-rose-500/60 px-2 py-1 text-xs font-semibold text-rose-300 hover:border-rose-300 hover:text-rose-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 border-t border-slate-700 pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          AI Suggest Improvement
        </p>
        <div className="flex gap-2">
          <input
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="e.g. make it more aggressive for SaaS founders"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => onEnhance(instruction)}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50"
          >
            Improve
          </button>
        </div>
      </div>
    </article>
  );
};
