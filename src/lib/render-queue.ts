import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { RenderJobStatus, VideoBlueprint } from "./video-types";

type RenderInput = {
  blueprint: VideoBlueprint;
  screenshotBase64: string;
  sourceUrl: string;
  tone?: string;
};

type RenderJob = {
  id: string;
  status: RenderJobStatus;
  progress: number;
  createdAt: number;
  updatedAt: number;
  videoUrl?: string;
  error?: string;
};

const jobs = new Map<string, RenderJob>();
let bundlePromise: Promise<string> | null = null;
const JOB_DIR = process.env.VERCEL
  ? "/tmp/vidiski-render-jobs"
  : path.join(process.cwd(), ".tmp", "render-jobs");

const getBundleLocation = async () => {
  if (!bundlePromise) {
    bundlePromise = bundle({ entryPoint: path.join(process.cwd(), "src/remotion/index.ts") });
  }
  return bundlePromise;
};

const ensureJobDir = async () => {
  await mkdir(JOB_DIR, { recursive: true });
};

const getJobPath = (id: string) => path.join(JOB_DIR, `${id}.json`);

const persistJob = async (job: RenderJob) => {
  await ensureJobDir();
  await writeFile(getJobPath(job.id), JSON.stringify(job), "utf8");
};

const updateJob = async (id: string, patch: Partial<RenderJob>) => {
  const current = jobs.get(id);
  if (!current) return;
  const next = { ...current, ...patch, updatedAt: Date.now() };
  jobs.set(id, next);
  await persistJob(next);
};

export const startRenderJob = (input: RenderInput) => {
  const id = randomUUID();
  const initialJob: RenderJob = {
    id,
    status: "queued",
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  jobs.set(id, initialJob);
  void persistJob(initialJob);

  void (async () => {
    try {
      await updateJob(id, { status: "rendering", progress: 3 });
      const outputDirectory = path.join(process.cwd(), "public", "videos");
      await mkdir(outputDirectory, { recursive: true });
      const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.mp4`;
      const outputLocation = path.join(outputDirectory, fileName);
      const serveUrl = await getBundleLocation();
      const inputProps = input;

      const composition = await selectComposition({
        serveUrl,
        id: "PromoVideo",
        inputProps
      });

      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation,
        inputProps,
        timeoutInMilliseconds: 300000,
        concurrency: 2,
        onProgress: ({ progress }) => {
          const normalized = Math.max(5, Math.min(98, Math.round(progress * 100)));
          void updateJob(id, { progress: normalized });
        }
      });

      await updateJob(id, { status: "done", progress: 100, videoUrl: `/videos/${fileName}` });
    } catch (error) {
      await updateJob(id, {
        status: "error",
        progress: 100,
        error: error instanceof Error ? error.message : "Render failed."
      });
    }
  })();

  return id;
};

export const getRenderJob = async (id: string) => {
  const inMemory = jobs.get(id);
  if (inMemory) return inMemory;
  try {
    const raw = await readFile(getJobPath(id), "utf8");
    return JSON.parse(raw) as RenderJob;
  } catch {
    return undefined;
  }
};
