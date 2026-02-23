import OpenAI from "openai";
import type { AnimationStyle, MarketingProfile, VideoBlueprint, VideoScene } from "./video-types";

const PROFILE_SCHEMA = {
  name: "marketing_profile",
  strict: true,
  schema: {
    type: "object",
    properties: {
      company_name: { type: "string" },
      product_name: { type: "string" },
      short_description: { type: "string" },
      target_audience: { type: "string" },
      core_pain_point: { type: "string" },
      unique_value_prop: { type: "string" },
      benefits: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      cta_text: { type: "string" },
      tone: { type: "string" }
    },
    required: [
      "company_name",
      "product_name",
      "short_description",
      "target_audience",
      "core_pain_point",
      "unique_value_prop",
      "benefits",
      "cta_text",
      "tone"
    ],
    additionalProperties: false
  }
} as const;

const BLUEPRINT_SCHEMA = {
  name: "video_blueprint",
  strict: true,
  schema: {
    type: "object",
    properties: {
      duration_seconds: { type: "number", const: 30 },
      fps: { type: "number", const: 30 },
      scenes: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            start: { type: "number" },
            duration: { type: "number" },
            type: { type: "string", enum: ["pain", "solution", "benefits", "cta"] },
            main_text: { type: "string" },
            sub_text: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            animation_style: {
              type: "string",
              enum: ["smooth-rise", "kinetic-slide", "cinematic-zoom", "pop-bounce", "glitch-pop"]
            },
            background_screenshot: { type: "boolean" }
          },
          required: [
            "start",
            "duration",
            "type",
            "main_text",
            "sub_text",
            "bullets",
            "animation_style",
            "background_screenshot"
          ],
          additionalProperties: false
        }
      }
    },
    required: ["duration_seconds", "fps", "scenes"],
    additionalProperties: false
  }
} as const;

const SCENE_ENHANCE_SCHEMA = {
  name: "scene_enhancement",
  strict: true,
  schema: {
    type: "object",
    properties: {
      main_text: { type: "string" },
      sub_text: { type: "string" },
      bullets: { type: "array", items: { type: "string" } },
      animation_style: {
        type: "string",
        enum: ["smooth-rise", "kinetic-slide", "cinematic-zoom", "pop-bounce", "glitch-pop"]
      }
    },
    required: ["main_text", "sub_text", "bullets", "animation_style"],
    additionalProperties: false
  }
} as const;

const VARIANT_SCHEMA = {
  name: "blueprint_variants",
  strict: true,
  schema: {
    type: "object",
    properties: {
      variants: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            style_label: { type: "string" },
            blueprint: BLUEPRINT_SCHEMA.schema
          },
          required: ["style_label", "blueprint"],
          additionalProperties: false
        }
      }
    },
    required: ["variants"],
    additionalProperties: false
  }
} as const;

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const parseStructuredOutput = async <T>({
  userPrompt,
  schema,
  temperature = 0.4
}: {
  userPrompt: string;
  schema: { name: string; strict: boolean; schema: Record<string, unknown> };
  temperature?: number;
}) => {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature,
    messages: [
      { role: "system", content: "Return JSON only. Follow the provided schema exactly." },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_schema", json_schema: schema }
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Model did not return structured content.");
  }
  return JSON.parse(content) as T;
};

export const extractMarketingProfile = async (scrapedPayload: object) =>
  parseStructuredOutput<MarketingProfile>({
    schema: PROFILE_SCHEMA,
    userPrompt: [
      "Extract startup marketing essentials from this homepage payload.",
      "Return concise, high-signal copy suitable for a launch promo video.",
      "Focus on specificity over fluff.",
      "",
      JSON.stringify(scrapedPayload, null, 2)
    ].join("\n")
  });

export const generateBlueprint = async ({
  profile,
  userIntent
}: {
  profile: MarketingProfile;
  userIntent?: string;
}) =>
  parseStructuredOutput<VideoBlueprint>({
    schema: BLUEPRINT_SCHEMA,
    userPrompt: [
      "Create a premium-minimalist 30-second promo blueprint.",
      "Must be exactly 4 scenes in this order and duration (frames at 30fps):",
      "- pain: start 0, duration 270",
      "- solution: start 270, duration 270",
      "- benefits: start 540, duration 270",
      "- cta: start 810, duration 90",
      "Benefits scene should have 2-4 short bullets.",
      "Choose one animation_style per scene from:",
      "smooth-rise, kinetic-slide, cinematic-zoom, pop-bounce, glitch-pop.",
      "Use motion that matches emotional intent: pain=kinetic/glitch, solution=zoom/smooth, benefits=clean rise, cta=bold bounce.",
      userIntent ? `Creative direction: ${userIntent}` : "",
      "",
      "Marketing profile:",
      JSON.stringify(profile, null, 2)
    ]
      .filter(Boolean)
      .join("\n")
  });

export const enhanceSceneCopy = async ({
  scene,
  profile,
  instruction,
  fullBlueprint
}: {
  scene: VideoScene;
  profile: MarketingProfile;
  instruction: string;
  fullBlueprint: VideoBlueprint;
}) =>
  parseStructuredOutput<{
    main_text: string;
    sub_text: string;
    bullets: string[];
    animation_style: AnimationStyle;
  }>({
    schema: SCENE_ENHANCE_SCHEMA,
    temperature: 0.55,
    userPrompt: [
      "Rewrite this single video scene for a startup launch promo.",
      "Preserve scene purpose (pain/solution/benefits/cta), keep copy punchy and readable.",
      "If scene type is not benefits, return an empty bullets array.",
      "Set animation_style from: smooth-rise, kinetic-slide, cinematic-zoom, pop-bounce, glitch-pop.",
      `Instruction: ${instruction || "Improve clarity and impact."}`,
      "",
      "Current scene:",
      JSON.stringify(scene, null, 2),
      "",
      "Profile context:",
      JSON.stringify(profile, null, 2),
      "",
      "Whole blueprint context:",
      JSON.stringify(fullBlueprint, null, 2)
    ].join("\n")
  });

export const generateBlueprintVariants = async ({
  profile,
  blueprint,
  prompt
}: {
  profile: MarketingProfile;
  blueprint: VideoBlueprint;
  prompt?: string;
}) =>
  parseStructuredOutput<{
    variants: Array<{ style_label: string; blueprint: VideoBlueprint }>;
  }>({
    schema: VARIANT_SCHEMA,
    temperature: 0.65,
    userPrompt: [
      "Generate 2-3 new blueprint variants with distinct copy styles for founders.",
      "Suggested styles: bold & direct, inspirational, data-driven.",
      "Respect exact timing and scene structure.",
      "Each scene must include a strong animation_style choice that fits that variant style.",
      prompt ? `Additional prompt: ${prompt}` : "",
      "",
      "Current profile:",
      JSON.stringify(profile, null, 2),
      "",
      "Current blueprint:",
      JSON.stringify(blueprint, null, 2)
    ]
      .filter(Boolean)
      .join("\n")
  });
