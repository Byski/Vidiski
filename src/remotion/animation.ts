import { interpolate, spring } from "remotion";
import type { AnimationStyle } from "../lib/video-types";

export const sceneIn = (frame: number, fps: number) =>
  spring({ fps, frame, config: { damping: 18, stiffness: 130, mass: 0.8 } });

export const sceneOut = (frame: number, duration: number) =>
  interpolate(frame, [Math.max(duration - 20, 0), duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

export const sceneCrossfade = (frame: number, duration: number) => {
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const fadeOut = sceneOut(frame, duration);
  return Math.min(fadeIn, fadeOut);
};

export const subtleParallax = (frame: number) =>
  interpolate(frame, [0, 270], [0, -36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

export const textMotionPreset = ({
  style,
  frame,
  fps
}: {
  style: AnimationStyle;
  frame: number;
  fps: number;
}) => {
  if (style === "kinetic-slide") {
    const progress = spring({ fps, frame, config: { damping: 14, stiffness: 180, mass: 0.8 } });
    return {
      opacity: progress,
      translateY: interpolate(progress, [0, 1], [40, 0]),
      translateX: interpolate(progress, [0, 1], [28, 0]),
      scale: interpolate(progress, [0, 1], [0.94, 1])
    };
  }

  if (style === "cinematic-zoom") {
    const progress = spring({ fps, frame, config: { damping: 20, stiffness: 120, mass: 0.9 } });
    return {
      opacity: progress,
      translateY: interpolate(progress, [0, 1], [14, 0]),
      translateX: 0,
      scale: interpolate(progress, [0, 1], [0.84, 1])
    };
  }

  if (style === "pop-bounce") {
    const progress = spring({ fps, frame, config: { damping: 10, stiffness: 160, mass: 0.65 } });
    return {
      opacity: progress,
      translateY: interpolate(progress, [0, 1], [34, 0]),
      translateX: 0,
      scale: interpolate(progress, [0, 1], [0.75, 1])
    };
  }

  if (style === "glitch-pop") {
    const progress = spring({ fps, frame, config: { damping: 12, stiffness: 220, mass: 0.6 } });
    const jitter = frame < 8 ? Math.sin(frame * 1.6) * 8 : 0;
    return {
      opacity: progress,
      translateY: interpolate(progress, [0, 1], [26, 0]),
      translateX: jitter,
      scale: interpolate(progress, [0, 1], [0.86, 1])
    };
  }

  const progress = spring({ fps, frame, config: { damping: 18, stiffness: 130, mass: 0.8 } });
  return {
    opacity: progress,
    translateY: interpolate(progress, [0, 1], [24, 0]),
    translateX: 0,
    scale: interpolate(progress, [0, 1], [0.95, 1])
  };
};
