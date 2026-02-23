import { NextResponse } from "next/server";
import { sanitizeBlueprint } from "@/src/lib/blueprint";
import { generateBlueprint, generateBlueprintVariants } from "@/src/lib/openai";
import type { MarketingProfile, VideoBlueprint } from "@/src/lib/video-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      profile?: MarketingProfile;
      blueprint?: VideoBlueprint;
      prompt?: string;
      variants?: boolean;
    };

    if (!payload.profile) {
      return NextResponse.json({ error: "profile is required." }, { status: 400 });
    }

    if (payload.variants && payload.blueprint) {
      const result = await generateBlueprintVariants({
        profile: payload.profile,
        blueprint: payload.blueprint,
        prompt: payload.prompt
      });
      const variants = result.variants.map((variant) => ({
        style_label: variant.style_label,
        blueprint: sanitizeBlueprint(variant.blueprint, payload.profile as MarketingProfile)
      }));
      return NextResponse.json({ ok: true, variants });
    }

    const rawBlueprint = await generateBlueprint({
      profile: payload.profile,
      userIntent: payload.prompt
    });
    const blueprint = sanitizeBlueprint(rawBlueprint, payload.profile);
    return NextResponse.json({ ok: true, blueprint });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to regenerate blueprint.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
