import type { MarketingProfile, VideoBlueprint, VideoScene } from "./video-types";
import { sanitizeAnimationStyle } from "./animation-presets";

export const FRAME_SLOTS = [
  { type: "pain" as const, start: 0, duration: 270 },
  { type: "solution" as const, start: 270, duration: 270 },
  { type: "benefits" as const, start: 540, duration: 270 },
  { type: "cta" as const, start: 810, duration: 90 }
];

export const sanitizeBullets = (input: unknown, fallback: string[]) => {
  const normalized = Array.isArray(input)
    ? input
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
        .slice(0, 4)
    : [];
  return normalized.length > 0 ? normalized : fallback.slice(0, 4);
};

export const sanitizeBlueprint = (raw: unknown, profile: MarketingProfile): VideoBlueprint => {
  const fallbackByType: Record<VideoScene["type"], Omit<VideoScene, "start" | "duration">> = {
    pain: {
      type: "pain",
      main_text: profile.core_pain_point || "The old way of launching is too slow.",
      sub_text: `Made for ${profile.target_audience}`,
      bullets: [],
      animation_style: "kinetic-slide",
      background_screenshot: true
    },
    solution: {
      type: "solution",
      main_text: profile.product_name || profile.company_name || "Your Product",
      sub_text: profile.unique_value_prop || profile.short_description || "Built to move faster.",
      bullets: [],
      animation_style: "cinematic-zoom",
      background_screenshot: true
    },
    benefits: {
      type: "benefits",
      main_text: "Why it works",
      sub_text: "Clarity, speed, and momentum",
      bullets: profile.benefits.slice(0, 4),
      animation_style: "smooth-rise",
      background_screenshot: true
    },
    cta: {
      type: "cta",
      main_text: profile.cta_text || "Start today",
      sub_text: "See what your launch can look like",
      bullets: [],
      animation_style: "pop-bounce",
      background_screenshot: true
    }
  };

  const rawScenes =
    raw && typeof raw === "object" && Array.isArray((raw as { scenes?: unknown }).scenes)
      ? ((raw as { scenes: unknown[] }).scenes as Array<Partial<VideoScene>>)
      : [];

  const byType = new Map<VideoScene["type"], Partial<VideoScene>>();
  for (const scene of rawScenes) {
    if (
      scene &&
      typeof scene === "object" &&
      scene.type &&
      ["pain", "solution", "benefits", "cta"].includes(scene.type)
    ) {
      byType.set(scene.type as VideoScene["type"], scene);
    }
  }

  const scenes = FRAME_SLOTS.map((slot) => {
    const candidate = byType.get(slot.type) ?? {};
    const fallback = fallbackByType[slot.type];
    return {
      start: slot.start,
      duration: slot.duration,
      type: slot.type,
      main_text:
        typeof candidate.main_text === "string" && candidate.main_text.trim().length > 0
          ? candidate.main_text.trim().slice(0, 100)
          : fallback.main_text,
      sub_text:
        typeof candidate.sub_text === "string" && candidate.sub_text.trim().length > 0
          ? candidate.sub_text.trim().slice(0, 140)
          : fallback.sub_text,
      bullets:
        slot.type === "benefits"
          ? sanitizeBullets(candidate.bullets, fallback.bullets)
          : sanitizeBullets(candidate.bullets, []),
      animation_style: sanitizeAnimationStyle(candidate.animation_style, fallback.animation_style),
      background_screenshot: true
    };
  }) as [VideoScene, VideoScene, VideoScene, VideoScene];

  return {
    duration_seconds: 30,
    fps: 30,
    scenes
  };
};
