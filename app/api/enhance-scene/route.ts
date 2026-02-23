import { NextResponse } from "next/server";
import { sanitizeBullets } from "@/src/lib/blueprint";
import { sanitizeAnimationStyle } from "@/src/lib/animation-presets";
import { enhanceSceneCopy } from "@/src/lib/openai";
import type { MarketingProfile, VideoBlueprint, VideoScene } from "@/src/lib/video-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      scene?: VideoScene;
      profile?: MarketingProfile;
      blueprint?: VideoBlueprint;
      instruction?: string;
    };

    if (!payload.scene || !payload.profile || !payload.blueprint) {
      return NextResponse.json(
        { error: "scene, profile, and blueprint are required." },
        { status: 400 }
      );
    }

    const rewritten = await enhanceSceneCopy({
      scene: payload.scene,
      profile: payload.profile,
      fullBlueprint: payload.blueprint,
      instruction: payload.instruction ?? ""
    });

    const enhancedScene: VideoScene = {
      ...payload.scene,
      main_text: rewritten.main_text.trim().slice(0, 100),
      sub_text: rewritten.sub_text.trim().slice(0, 150),
      bullets:
        payload.scene.type === "benefits" ? sanitizeBullets(rewritten.bullets, payload.scene.bullets) : [],
      animation_style: sanitizeAnimationStyle(rewritten.animation_style, payload.scene.animation_style)
    };

    return NextResponse.json({ ok: true, scene: enhancedScene });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to enhance scene.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
