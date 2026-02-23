# Vidiski

Minimal MVP Next.js app that turns a URL into a 30-second vertical promo MP4.

## Stack

- Next.js 15+ App Router
- Tailwind CSS
- Playwright scraping
- OpenAI Structured Outputs (`gpt-4o-mini`)
- Remotion rendering (`1080x1920`, `30fps`, `900 frames`)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add environment variables:

   ```bash
   cp .env.example .env
   ```

   Set `OPENAI_API_KEY` in `.env`.

3. Start development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## API

- `POST /api/generate`
  - body: `{ "url": "https://example.com" }`
  - response: `{ ok: true, videoUrl: "/videos/....mp4", blueprint: ... }`

## Notes

- Generated MP4 files are saved to `public/videos/`.
- For Vercel runtime, Playwright launch uses `@sparticuz/chromium`.
