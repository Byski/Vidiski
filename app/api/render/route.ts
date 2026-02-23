import { NextResponse } from "next/server";
import { sanitizeBlueprint } from "@/src/lib/blueprint";
import { startRenderJob } from "@/src/lib/render-queue";
import type { MarketingProfile, VideoBlueprint } from "@/src/lib/video-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      blueprint?: VideoBlueprint;
      profile?: MarketingProfile;
      screenshotBase64?: string;
      sourceUrl?: string;
    };

    if (!payload.blueprint || !payload.profile || !payload.screenshotBase64 || !payload.sourceUrl) {
      return NextResponse.json(
        { error: "blueprint, profile, screenshotBase64, and sourceUrl are required." },
        { status: 400 }
      );
    }

    const blueprint = sanitizeBlueprint(payload.blueprint, payload.profile);
    const renderJobId = startRenderJob({
      blueprint,
      screenshotBase64: payload.screenshotBase64,
      sourceUrl: payload.sourceUrl,
      tone: payload.profile.tone
    });

    return NextResponse.json({ ok: true, renderJobId, blueprint });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start render.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
