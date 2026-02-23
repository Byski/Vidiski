import type { AnimationStyle } from "./video-types";

export const ANIMATION_STYLES: AnimationStyle[] = [
  "smooth-rise",
  "kinetic-slide",
  "cinematic-zoom",
  "pop-bounce",
  "glitch-pop"
];

export const ANIMATION_STYLE_LABELS: Record<AnimationStyle, string> = {
  "smooth-rise": "Smooth Rise",
  "kinetic-slide": "Kinetic Slide",
  "cinematic-zoom": "Cinematic Zoom",
  "pop-bounce": "Pop Bounce",
  "glitch-pop": "Glitch Pop"
};

export const isAnimationStyle = (value: unknown): value is AnimationStyle =>
  typeof value === "string" && ANIMATION_STYLES.includes(value as AnimationStyle);

export const sanitizeAnimationStyle = (
  value: unknown,
  fallback: AnimationStyle = "smooth-rise"
): AnimationStyle => (isAnimationStyle(value) ? value : fallback);
