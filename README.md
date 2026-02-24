# Vidiski

Vidiski is an AI launch-video studio that turns any homepage URL into a polished 30-second vertical promo.

Our goal is simple: remove the gap between building a product and telling its story. Founders ship fast, but content production is still slow and expensive. Vidiski compresses that workflow into one flow: URL in, editable narrative out, MP4 exported.

---

## Why Vidiski Exists

Early-stage teams move quickly, but go-to-market content usually becomes a bottleneck:

- scripting takes time
- motion design is specialized
- iteration cycles are expensive
- launch windows are short

Vidiski solves this by combining scraping, structured AI copy generation, scene editing, and automated rendering in one product surface.

---

## Product Experience

1. Paste a homepage URL.
2. Vidiski scrapes the page and extracts core marketing signals.
3. AI generates a structured 4-scene video blueprint.
4. User edits copy, bullets, and animation style in the studio.
5. Vidiski renders a 1080x1920 MP4 and returns it for preview/download.

Video format is fixed for launch velocity:

- 30 seconds
- 30 fps
- 9:16 vertical
- 4 scenes (pain, solution, benefits, CTA)

---

## Tech Blend

### Frontend

- Next.js 15+ (App Router)
- React 19 + TypeScript
- Tailwind CSS (responsive, dark-first UI)

### AI + Content Intelligence

- OpenAI `gpt-4o-mini`
- Structured Outputs (`json_schema`) for reliable typed responses
  - marketing profile extraction
  - blueprint generation
  - scene enhancement
  - variant generation

### Scraping + Capture

- Playwright for page loading and extraction
- DOM cleanup to remove noisy layout elements
- full-page screenshot capture for video backgrounds

### Video Rendering

- Remotion 4 (`@remotion/bundler`, `@remotion/renderer`)
- server-side MP4 rendering pipeline
- animated text, scene themes, gradients, and screenshot overlays

### Runtime + Deployment

- Node runtime API routes
- Vercel-compatible browser launch (`@sparticuz/chromium`)
- render-job persistence in `.tmp` (local) or `/tmp` (serverless)

---

## Architecture Overview

### API Routes

- `POST /api/generate`
  - validates URL
  - scrapes site + screenshot
  - extracts `MarketingProfile`
  - generates and sanitizes `VideoBlueprint`
  - starts async render job

- `POST /api/render`
  - re-renders user-edited blueprint

- `GET /api/render-status/[jobId]`
  - returns job state (`queued`, `rendering`, `done`, `error`) + progress

- `POST /api/enhance-scene`
  - rewrites one scene with user instruction

- `POST /api/regenerate-blueprint`
  - regenerates blueprint or returns 2-3 style variants

### Core Libraries

- `src/lib/scraper.ts` - Playwright extraction
- `src/lib/openai.ts` - AI prompts + structured schemas
- `src/lib/blueprint.ts` - strict scene normalization
- `src/lib/render-queue.ts` - async render orchestration
- `src/remotion/*` - composition, themes, animations, scenes

---

## Local Development

### Prerequisites

- Node.js 20+
- npm

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env` in project root:

```bash
OPENAI_API_KEY=your_openai_api_key
```

### 3) Install Playwright browser (first run)

```bash
npx playwright install chromium
```

### 4) Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build + type check
- `npm run start` - run production server
- `npm run lint` - lint app
- `npm run remotion:studio` - open Remotion Studio

---

## Current Product Focus

Vidiski is intentionally opinionated right now:

- no auth
- no database
- no billing

This keeps iteration speed high while validating the core loop: generation quality, editing ergonomics, and render reliability.

---

## Roadmap Direction

- richer scene-level previews (still frames / motion previews)
- stronger style systems and brand adaptation
- production media storage strategy (object storage)
- collaboration and workspace features
- publishing and distribution integrations

---

## Vision

Vidiski aims to become the fastest path from product page to launch-ready storytelling.

When teams can explain value clearly, they move faster. Vidiski exists to make that moment immediate.
