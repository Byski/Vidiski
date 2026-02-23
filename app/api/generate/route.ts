import { NextResponse } from "next/server";
import { sanitizeBlueprint } from "@/src/lib/blueprint";
import { extractMarketingProfile, generateBlueprint } from "@/src/lib/openai";
import { startRenderJob } from "@/src/lib/render-queue";
import { scrapeWebsite } from "@/src/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ensureValidUrl = (rawUrl: string) => {
  const normalized = rawUrl.trim();
  const url = new URL(normalized);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http:// and https:// URLs are supported.");
  }
  return url.toString();
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { url?: string; creativeDirection?: string };
    if (!payload?.url || typeof payload.url !== "string") {
      return NextResponse.json({ error: "Please provide a valid URL." }, { status: 400 });
    }

    let targetUrl = "";
    try {
      targetUrl = ensureValidUrl(payload.url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL. Please include http:// or https://." },
        { status: 400 }
      );
    }

    const { scraped, screenshotBase64 } = await scrapeWebsite(targetUrl);
    const profile = await extractMarketingProfile(scraped);
    const rawBlueprint = await generateBlueprint({
      profile,
      userIntent: payload.creativeDirection
    });
    const blueprint = sanitizeBlueprint(rawBlueprint, profile);

    const renderJobId = startRenderJob({
      blueprint,
      screenshotBase64,
      sourceUrl: targetUrl,
      tone: profile.tone
    });

    return NextResponse.json({
      ok: true,
      sourceUrl: targetUrl,
      scraped,
      profile,
      screenshotBase64,
      blueprint,
      renderJobId
    });
  } catch (error) {
    console.error("Failed to generate video", error);
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while generating your video. Please retry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
