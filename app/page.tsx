"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { RenderProgress } from "@/src/components/RenderProgress";
import { SceneCard } from "@/src/components/SceneCard";
import { ScrapedSidebar } from "@/src/components/ScrapedSidebar";
import type { MarketingProfile, RenderJobStatus, ScrapedContent, VideoBlueprint, VideoScene } from "@/src/lib/video-types";

const LOAD_STEPS = ["Scraping site...", "Extracting profile...", "Generating blueprint...", "Queueing render..."] as const;
const DRAFT_KEY = "vidiski-draft-v2";
const EXAMPLE_VIDEOS = [
  {
    title: "SaaS Launch",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    caption: "Bold and direct founder messaging"
  },
  {
    title: "Product Reveal",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    caption: "Minimal premium reveal style"
  },
  {
    title: "Conversion Push",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    caption: "CTA-focused 30-second cut"
  }
] as const;

type GenerateResponse = {
  ok: true;
  sourceUrl: string;
  scraped: ScrapedContent;
  profile: MarketingProfile;
  screenshotBase64: string;
  blueprint: VideoBlueprint;
  renderJobId: string;
};

type RenderStatusResponse = {
  id: string;
  status: RenderJobStatus;
  progress: number;
  videoUrl?: string;
  error?: string;
};

const normalizeUrl = (input: string) => {
  const raw = input.trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return `https://${raw}`;
};

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [url, setUrl] = useState("");
  const [creativeDirection, setCreativeDirection] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sceneBusy, setSceneBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState<RenderJobStatus | null>(null);
  const [profile, setProfile] = useState<MarketingProfile | null>(null);
  const [scraped, setScraped] = useState<ScrapedContent | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<VideoBlueprint | null>(null);
  const [variants, setVariants] = useState<Array<{ style_label: string; blueprint: VideoBlueprint }>>([]);
  const [globalInstruction, setGlobalInstruction] = useState("");
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [insertTarget, setInsertTarget] = useState<"main" | "sub">("main");

  const canSubmit = useMemo(() => url.trim().length > 0 && !busy, [url, busy]);
  const showOnboarding = useMemo(
    () => !blueprint && !videoUrl && !renderJobId && !busy,
    [blueprint, videoUrl, renderJobId, busy]
  );

  const pollRenderStatus = async (jobId: string) => {
    const res = await fetch(`/api/render-status/${jobId}`);
    if (!res.ok) throw new Error("Could not read render progress.");
    const payload = (await res.json()) as RenderStatusResponse;
    setRenderStatus(payload.status);
    setRenderProgress(payload.progress);
    if (payload.status === "done" && payload.videoUrl) {
      setVideoUrl(payload.videoUrl);
      setStatus("Render complete.");
      setRenderJobId(null);
    }
    if (payload.status === "error") {
      throw new Error(payload.error || "Rendering failed.");
    }
  };

  useEffect(() => {
    if (!renderJobId) return;
    const timer = window.setInterval(() => {
      void pollRenderStatus(renderJobId).catch((e) => {
        setError(e instanceof Error ? e.message : "Render status failed.");
        setRenderJobId(null);
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [renderJobId]);

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        url?: string;
        sourceUrl?: string;
        profile?: MarketingProfile;
        scraped?: ScrapedContent;
        screenshotBase64?: string;
        blueprint?: VideoBlueprint;
      };
      if (parsed.url) setUrl(parsed.url);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.scraped) setScraped(parsed.scraped);
      if (parsed.screenshotBase64) setScreenshotBase64(parsed.screenshotBase64);
      if (parsed.blueprint) setBlueprint(parsed.blueprint);
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!blueprint || !profile || !scraped || !screenshotBase64) return;
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        url,
        profile,
        scraped,
        screenshotBase64,
        blueprint
      })
    );
  }, [url, profile, scraped, screenshotBase64, blueprint]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    setVideoUrl(null);
    setStatus(LOAD_STEPS[0]);
    setRenderStatus("queued");
    setRenderProgress(0);
    setVariants([]);

    let index = 0;
    const statusTimer = window.setInterval(() => {
      index = Math.min(index + 1, LOAD_STEPS.length - 1);
      setStatus(LOAD_STEPS[index]);
    }, 2200);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizeUrl(url), creativeDirection })
      });
      const data = (await response.json()) as GenerateResponse | { error?: string };
      const apiError = "error" in data ? data.error : undefined;

      if (!response.ok || !("renderJobId" in data)) {
        throw new Error(apiError || "Could not generate video from this URL.");
      }
      setProfile(data.profile);
      setScraped(data.scraped);
      setScreenshotBase64(data.screenshotBase64);
      setBlueprint(data.blueprint);
      setRenderJobId(data.renderJobId);
      setStatus("Rendering video...");
      setRenderStatus("rendering");
      setUrl(data.sourceUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error while generating video.");
      setStatus(null);
    } finally {
      window.clearInterval(statusTimer);
      setBusy(false);
    }
  };

  const updateScene = (sceneIndex: number, updater: (scene: VideoScene) => VideoScene) => {
    setBlueprint((current) => {
      if (!current) return current;
      const nextScenes = current.scenes.map((scene, index) =>
        index === sceneIndex ? updater(scene) : scene
      ) as VideoBlueprint["scenes"];
      return { ...current, scenes: nextScenes };
    });
  };

  const rerender = async () => {
    if (!blueprint || !profile || !screenshotBase64 || !url) return;
    setError(null);
    setRenderProgress(0);
    setRenderStatus("queued");
    setStatus("Rendering edited blueprint...");
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blueprint,
        profile,
        screenshotBase64,
        sourceUrl: normalizeUrl(url)
      })
    });
    const data = (await res.json()) as { renderJobId?: string; blueprint?: VideoBlueprint; error?: string };
    if (!res.ok || !data.renderJobId || !data.blueprint) {
      throw new Error(data.error || "Could not start re-render.");
    }
    setBlueprint(data.blueprint);
    setRenderStatus("rendering");
    setRenderJobId(data.renderJobId);
  };

  const enhanceScene = async (sceneIndex: number, instruction: string) => {
    if (!blueprint || !profile) return;
    setSceneBusy(sceneIndex);
    try {
      const scene = blueprint.scenes[sceneIndex];
      const response = await fetch("/api/enhance-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene,
          profile,
          blueprint,
          instruction
        })
      });
      const data = (await response.json()) as { scene?: VideoScene; error?: string };
      if (!response.ok || !data.scene) throw new Error(data.error || "Could not enhance scene.");
      updateScene(sceneIndex, () => data.scene as VideoScene);
    } finally {
      setSceneBusy(null);
    }
  };

  const regenerateAllScenes = async () => {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/regenerate-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          blueprint,
          prompt: globalInstruction
        })
      });
      const data = (await response.json()) as { blueprint?: VideoBlueprint; error?: string };
      if (!response.ok || !data.blueprint) {
        throw new Error(data.error || "Could not regenerate blueprint.");
      }
      setBlueprint(data.blueprint);
    } finally {
      setBusy(false);
    }
  };

  const generateVariants = async () => {
    if (!profile || !blueprint) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/regenerate-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          blueprint,
          prompt: globalInstruction,
          variants: true
        })
      });
      const data = (await response.json()) as {
        variants?: Array<{ style_label: string; blueprint: VideoBlueprint }>;
        error?: string;
      };
      if (!response.ok || !data.variants) {
        throw new Error(data.error || "Could not generate variants.");
      }
      setVariants(data.variants);
    } finally {
      setBusy(false);
    }
  };

  const onInsertFromScrape = (text: string) => {
    if (!blueprint) return;
    updateScene(activeSceneIndex, (scene) => ({
      ...scene,
      [insertTarget === "main" ? "main_text" : "sub_text"]: text
    }));
  };

  const previewSceneOnly = (scene: VideoScene) => {
    const element = videoRef.current;
    if (!element) return;
    const startSeconds = scene.start / 30;
    const endSeconds = (scene.start + scene.duration) / 30;
    element.currentTime = startSeconds;
    void element.play();
    const timer = window.setInterval(() => {
      if (element.currentTime >= endSeconds) {
        element.pause();
        window.clearInterval(timer);
      }
    }, 100);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1400px] px-4 py-8 md:px-6">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm md:p-8">
        {showOnboarding ? (
          <section className="mx-auto max-w-5xl py-6 md:py-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex rounded-full border border-white/10 bg-black/25 px-4 py-1 text-xs tracking-wide text-slate-300">
                AI launch video studio
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-6xl">
                Turn your homepage into a premium 30-second launch video
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
                Paste your URL, let AI build the script, and export a polished vertical promo in minutes.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-3xl space-y-3">
              <input
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://your-site.com"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-base text-white outline-none backdrop-blur focus:border-cyan-400/60"
              />
              <input
                type="text"
                value={creativeDirection}
                onChange={(event) => setCreativeDirection(event.target.value)}
                placeholder="Optional direction: bold, urgent, founder-focused"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-base text-white outline-none backdrop-blur focus:border-cyan-400/60"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-300 px-5 py-4 text-base font-semibold text-slate-900 transition hover:scale-[1.01] hover:from-cyan-200 hover:to-blue-200 disabled:opacity-50"
              >
                {busy ? "Working..." : "Create my 30-second launch video"}
              </button>
            </form>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {EXAMPLE_VIDEOS.map((example) => (
                <article
                  key={example.title}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur"
                >
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/80">
                    <video
                      src={example.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="aspect-[9/16] w-full object-cover"
                    />
                  </div>
                  <div className="px-1 pb-2 pt-3">
                    <p className="text-sm font-semibold text-white">{example.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{example.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Vidiski Studio</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
              Build startup launch videos from a URL, then edit every scene with AI help before final render.
            </p>

            <form onSubmit={onSubmit} className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://your-site.com"
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
              />
              <input
                type="text"
                value={creativeDirection}
                onChange={(event) => setCreativeDirection(event.target.value)}
                placeholder="Optional direction: bold & urgent for developers"
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:opacity-50"
              >
                {busy ? "Working..." : "Create my 30-second launch video"}
              </button>
            </form>
          </>
        )}

        {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
        {renderStatus ? <RenderProgress progress={renderProgress} status={renderStatus} /> : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="mt-6 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4 shadow-2xl shadow-black/30 backdrop-blur md:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-white md:text-lg">Video Preview</h2>
              <div className="flex flex-wrap gap-2">
                {videoUrl ? (
                  <a
                    href={videoUrl}
                    download
                    className="rounded-lg border border-slate-500 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-300"
                  >
                    Download MP4
                  </a>
                ) : null}
                <button
                  type="button"
                  disabled={!blueprint || busy}
                  onClick={() => {
                    void rerender().catch((e) => setError(e instanceof Error ? e.message : "Re-render failed."));
                  }}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white disabled:opacity-50"
                >
                  Re-render
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-2 md:p-3">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="mx-auto aspect-[9/16] w-full max-w-[360px] rounded-xl shadow-xl shadow-black/50"
                />
              ) : (
                <div className="mx-auto flex aspect-[9/16] w-full max-w-[360px] items-center justify-center rounded-xl bg-slate-900 text-xs text-slate-400">
                  Rendered video appears here
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur md:p-6">
            <div className="flex flex-wrap gap-2">
              {blueprint?.scenes.map((scene, sceneIndex) => (
                <button
                  key={`${scene.type}-${scene.start}`}
                  type="button"
                  onClick={() => setActiveSceneIndex(sceneIndex)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    activeSceneIndex === sceneIndex
                      ? "bg-cyan-300 text-slate-950"
                      : "border border-white/10 bg-slate-900/60 text-slate-200 hover:border-cyan-300/40"
                  }`}
                >
                  {scene.type}
                </button>
              ))}
            </div>

            {blueprint ? (
              <div className="mt-4">
                <SceneCard
                  scene={blueprint.scenes[activeSceneIndex]}
                  index={activeSceneIndex}
                  busy={sceneBusy === activeSceneIndex}
                  onMainChange={(value) => {
                    setInsertTarget("main");
                    updateScene(activeSceneIndex, (current) => ({ ...current, main_text: value }));
                  }}
                  onSubChange={(value) => {
                    setInsertTarget("sub");
                    updateScene(activeSceneIndex, (current) => ({ ...current, sub_text: value }));
                  }}
                  onAddBullet={() =>
                    updateScene(activeSceneIndex, (current) => ({
                      ...current,
                      bullets: current.type === "benefits" ? [...current.bullets, ""] : current.bullets
                    }))
                  }
                  onBulletChange={(bulletIndex, value) =>
                    updateScene(activeSceneIndex, (current) => ({
                      ...current,
                      bullets: current.bullets.map((bullet, idx) => (idx === bulletIndex ? value : bullet))
                    }))
                  }
                  onRemoveBullet={(bulletIndex) =>
                    updateScene(activeSceneIndex, (current) => ({
                      ...current,
                      bullets: current.bullets.filter((_, idx) => idx !== bulletIndex)
                    }))
                  }
                  onMoveBullet={(from, to) =>
                    updateScene(activeSceneIndex, (current) => {
                      const copy = [...current.bullets];
                      const [moved] = copy.splice(from, 1);
                      copy.splice(to, 0, moved);
                      return { ...current, bullets: copy };
                    })
                  }
                  onAnimationStyleChange={(value) =>
                    updateScene(activeSceneIndex, (current) => ({ ...current, animation_style: value }))
                  }
                  onEnhance={(instruction) => {
                    void enhanceScene(activeSceneIndex, instruction).catch((e) =>
                      setError(e instanceof Error ? e.message : "Scene enhancement failed.")
                    );
                  }}
                  onPreviewScene={() => previewSceneOnly(blueprint.scenes[activeSceneIndex])}
                />
              </div>
            ) : null}
          </div>

          <details className="group rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur md:p-6" open={false}>
            <summary className="cursor-pointer list-none text-sm font-semibold text-white">
              Advanced tools
              <span className="ml-2 text-xs font-normal text-slate-400 group-open:hidden">
                (regenerate, variants, source content, profile)
              </span>
            </summary>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Global AI controls</p>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row">
                    <input
                      value={globalInstruction}
                      onChange={(event) => setGlobalInstruction(event.target.value)}
                      placeholder="e.g. Make tone more aggressive and founder-focused"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void regenerateAllScenes().catch((e) =>
                          setError(e instanceof Error ? e.message : "Regeneration failed.")
                        );
                      }}
                      disabled={!blueprint || busy}
                      className="rounded-lg border border-slate-500 px-3 py-2 text-xs font-semibold text-slate-100 disabled:opacity-50"
                    >
                      Regenerate All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void generateVariants().catch((e) =>
                          setError(e instanceof Error ? e.message : "Variant generation failed.")
                        );
                      }}
                      disabled={!blueprint || busy}
                      className="rounded-lg border border-cyan-500/60 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-50"
                    >
                      Generate Variants
                    </button>
                  </div>
                  {variants.length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      {variants.map((variant) => (
                        <button
                          key={variant.style_label}
                          type="button"
                          onClick={() => setBlueprint(variant.blueprint)}
                          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-left text-xs text-slate-200 hover:border-slate-500"
                        >
                          <p className="font-semibold text-white">{variant.style_label}</p>
                          <p className="mt-1 text-slate-400">Apply this direction</p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <h3 className="text-sm font-semibold text-white">Profile Snapshot</h3>
                  {profile ? (
                    <div className="mt-3 space-y-2 text-xs text-slate-300">
                      <p>
                        <span className="text-slate-400">Company:</span> {profile.company_name}
                      </p>
                      <p>
                        <span className="text-slate-400">Product:</span> {profile.product_name}
                      </p>
                      <p>
                        <span className="text-slate-400">Audience:</span> {profile.target_audience}
                      </p>
                      <p>
                        <span className="text-slate-400">Tone:</span> {profile.tone}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Generated profile details appear here.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <h3 className="text-sm font-semibold text-white">Insert Mode</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Clicking source copy inserts into active scene {activeSceneIndex + 1} {insertTarget} field.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInsertTarget("main")}
                      className={`rounded-md px-2 py-1 text-xs ${
                        insertTarget === "main"
                          ? "bg-cyan-500 text-slate-950"
                          : "border border-slate-600 text-slate-300"
                      }`}
                    >
                      Main Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsertTarget("sub")}
                      className={`rounded-md px-2 py-1 text-xs ${
                        insertTarget === "sub"
                          ? "bg-cyan-500 text-slate-950"
                          : "border border-slate-600 text-slate-300"
                      }`}
                    >
                      Sub Text
                    </button>
                  </div>
                </div>
              </div>

              <aside className="lg:sticky lg:top-6 lg:h-fit">
                <ScrapedSidebar scraped={scraped} onInsertText={onInsertFromScrape} />
              </aside>
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
