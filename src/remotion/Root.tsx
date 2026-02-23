import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";
import type { VideoBlueprint } from "./types";

const fallbackBlueprint: VideoBlueprint = {
  duration_seconds: 30,
  fps: 30,
  scenes: [
    {
      start: 0,
      duration: 270,
      type: "pain",
      main_text: "Wasted launches burn time.",
      sub_text: "Too much effort, not enough momentum.",
      bullets: [],
      animation_style: "kinetic-slide",
      background_screenshot: true
    },
    {
      start: 270,
      duration: 270,
      type: "solution",
      main_text: "Meet Vidiski",
      sub_text: "Turn your homepage into a launch video.",
      bullets: [],
      animation_style: "cinematic-zoom",
      background_screenshot: true
    },
    {
      start: 540,
      duration: 270,
      type: "benefits",
      main_text: "Why teams ship with Vidiski",
      sub_text: "From URL to polished launch asset",
      bullets: ["URL in, video out", "Premium minimalist look", "Ready in minutes"],
      animation_style: "smooth-rise",
      background_screenshot: true
    },
    {
      start: 810,
      duration: 90,
      type: "cta",
      main_text: "Create your launch video",
      sub_text: "Start now",
      bullets: [],
      animation_style: "pop-bounce",
      background_screenshot: true
    }
  ]
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="PromoVideo"
      component={PromoVideo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        blueprint: fallbackBlueprint,
        screenshotBase64:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBgJSEux0AAAAASUVORK5CYII=",
        sourceUrl: "https://example.com",
        tone: "bold modern"
      }}
    />
  );
};
