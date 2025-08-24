// api/html-to-image.ts
// Works on Vercel prod (chromium-min) and locally (fallback to puppeteer)

import chromium from '@sparticuz/chromium-min';
import puppeteerCore from 'puppeteer-core';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  // Accept either raw string or { html }
  const html =
    (typeof req.body === 'string' && req.body) ||
    (req.body && (req.body as any).html) ||
    '';
  if (!html) return res.status(400).send('Missing html');

  let browser: any;
  try {
    // Try serverless Chromium first (works on Vercel prod)
    let executablePath: string | null = null;

    try {
      executablePath = await chromium.executablePath(); // may throw locally
    } catch {
      executablePath = null;
    }

    if (executablePath) {
      // Launch puppeteer-core against chromium-min
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      // Local fallback: use full puppeteer (bundled Chromium)
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.launch({ headless: true });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const buf = await page.screenshot({ type: 'png', fullPage: true });

    await browser.close();
    browser = null;

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buf);
  } catch (err: any) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    console.error('[html-to-image] error:', err?.stack || err);
    res.status(500).send(err?.message || 'Render failed');
  }
}
