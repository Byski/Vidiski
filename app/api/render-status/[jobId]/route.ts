import { NextResponse } from "next/server";
import { getRenderJob } from "@/src/lib/render-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = await getRenderJob(jobId);
  if (!job) {
    return NextResponse.json({
      id: jobId,
      status: "queued",
      progress: 0
    });
  }
  return NextResponse.json(job);
}
