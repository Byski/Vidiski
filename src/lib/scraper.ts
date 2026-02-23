import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright";
import type { ScrapedContent } from "./video-types";

const SCRAPE_REMOVE_SELECTORS = [
  "nav",
  "header",
  "footer",
  "[role='navigation']",
  "script",
  "style",
  "iframe",
  ".cookie-banner",
  ".cookie-consent",
  ".cookies",
  "[id*='cookie']",
  "[class*='cookie']",
  "[aria-label*='cookie']",
  "[aria-label*='Cookie']",
  "noscript",
  ".modal",
  ".popup",
  "[role='dialog']"
];

const getPlaywrightLaunchOptions = async () => {
  if (process.env.VERCEL) {
    const executablePath = await chromium.executablePath();
    return { executablePath, args: chromium.args, headless: true };
  }
  return { headless: true };
};

export const scrapeWebsite = async (
  targetUrl: string
): Promise<{ scraped: ScrapedContent; screenshotBase64: string }> => {
  const browser = await playwrightChromium.launch(await getPlaywrightLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 1440, height: 2600 } });

  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1200);

    await page.evaluate((selectors) => {
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => node.remove());
      });
    }, SCRAPE_REMOVE_SELECTORS);

    const screenshotBuffer = await page.screenshot({ fullPage: true, type: "png" });
    const scraped = await page.evaluate(() => {
      const root = document.querySelector("main") ?? document.querySelector("article") ?? document.body;
      const elements = Array.from(root.querySelectorAll("h1, h2, p, li"))
        .map((node) => {
          const type = node.tagName.toLowerCase();
          const content = (node.textContent ?? "").replace(/\s+/g, " ").trim();
          if (!["h1", "h2", "p", "li"].includes(type) || content.length < 8) return null;
          return { type: type as "h1" | "h2" | "p" | "li", content: content.slice(0, 280) };
        })
        .filter((item): item is { type: "h1" | "h2" | "p" | "li"; content: string } => Boolean(item))
        .slice(0, 160);

      return { title: (document.title || "Untitled").slice(0, 180), elements };
    });

    return {
      scraped,
      screenshotBase64: `data:image/png;base64,${screenshotBuffer.toString("base64")}`
    };
  } finally {
    await page.close();
    await browser.close();
  }
};
