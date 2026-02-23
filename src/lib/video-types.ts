export type SceneType = "pain" | "solution" | "benefits" | "cta";
export type AnimationStyle =
  | "smooth-rise"
  | "kinetic-slide"
  | "cinematic-zoom"
  | "pop-bounce"
  | "glitch-pop";

export type ScrapedElementType = "h1" | "h2" | "p" | "li";

export type ScrapedContent = {
  title: string;
  elements: Array<{ type: ScrapedElementType; content: string }>;
};

export type MarketingProfile = {
  company_name: string;
  product_name: string;
  short_description: string;
  target_audience: string;
  core_pain_point: string;
  unique_value_prop: string;
  benefits: string[];
  cta_text: string;
  tone: string;
};

export type VideoScene = {
  start: number;
  duration: number;
  type: SceneType;
  main_text: string;
  sub_text: string;
  bullets: string[];
  animation_style: AnimationStyle;
  background_screenshot: boolean;
};

export type VideoBlueprint = {
  duration_seconds: 30;
  fps: 30;
  scenes: [VideoScene, VideoScene, VideoScene, VideoScene];
};

export type RenderJobStatus = "queued" | "rendering" | "done" | "error";
