import type { SceneType } from "../lib/video-types";

type SceneTheme = {
  gradient: string;
  accent: string;
  overlay: string;
};

const fallbackTheme: SceneTheme = {
  gradient: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
  accent: "#60a5fa",
  overlay:
    "linear-gradient(to bottom, rgba(2,6,23,0.68) 0%, rgba(15,23,42,0.74) 55%, rgba(2,6,23,0.85) 100%)"
};

const sceneThemes: Record<SceneType, SceneTheme> = {
  pain: {
    gradient: "linear-gradient(145deg, #1f1116 0%, #451a1d 60%, #7f1d1d 100%)",
    accent: "#fb7185",
    overlay:
      "linear-gradient(to bottom, rgba(30,10,15,0.78) 0%, rgba(69,10,10,0.62) 55%, rgba(17,24,39,0.78) 100%)"
  },
  solution: {
    gradient: "linear-gradient(145deg, #0f172a 0%, #1d4ed8 100%)",
    accent: "#93c5fd",
    overlay:
      "linear-gradient(to bottom, rgba(7,15,36,0.7) 0%, rgba(30,58,138,0.62) 55%, rgba(15,23,42,0.82) 100%)"
  },
  benefits: {
    gradient: "linear-gradient(145deg, #052e16 0%, #065f46 55%, #14532d 100%)",
    accent: "#86efac",
    overlay:
      "linear-gradient(to bottom, rgba(2,44,34,0.72) 0%, rgba(6,95,70,0.62) 55%, rgba(17,24,39,0.82) 100%)"
  },
  cta: {
    gradient: "linear-gradient(145deg, #312e81 0%, #7c3aed 55%, #ea580c 100%)",
    accent: "#fdba74",
    overlay:
      "linear-gradient(to bottom, rgba(30,27,75,0.7) 0%, rgba(124,58,237,0.55) 55%, rgba(17,24,39,0.78) 100%)"
  }
};

export const getSceneTheme = (type: SceneType, tone?: string): SceneTheme => {
  const base = sceneThemes[type] ?? fallbackTheme;
  if (!tone) return base;
  const toneValue = tone.toLowerCase();
  if (toneValue.includes("minimal")) return { ...base, accent: "#cbd5e1" };
  if (toneValue.includes("bold")) return { ...base, accent: "#f8fafc" };
  return base;
};
