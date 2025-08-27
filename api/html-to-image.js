// api/html-to-image.js
// Single-pass, stitch-free screenshot of the ASCII <pre>
// Prod: puppeteer-core + @sparticuz/chromium; Local: full puppeteer

import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

const isProd = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  const html =
    (typeof req.body === 'string' && req.body) ||
    (req.body && req.body.html) ||
    '';
  if (!html) return res.status(400).send('Missing html');

  let browser;
  try {
    if (isProd) {
      const executablePath = await chromium.executablePath();
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath,
        headless: true,
        // defaultViewport doesn't matter; we'll set it to exact size later
      });
    } else {
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.launch({ headless: true });
    }

    const page = await browser.newPage();

    // 1) Load your HTML
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // 2) Normalize fonts/rendering (prod headless often lacks your desktop fonts)
    await page.addStyleTag({
      content: `
        html, body { margin:0; background:#000; }
        pre {
          font-family: "Courier New","DejaVu Sans Mono","Noto Sans Mono",monospace !important;
          font-variant-ligatures: none !important;
          -webkit-font-smoothing: antialiased;
          letter-spacing: 0;
          display: inline-block;
        }
      `
    });

    // 3) Measure the exact size we need for a single-pass capture
    const { w, h } = await page.evaluate(() => {
      const pre = document.querySelector('pre');
      if (!pre) throw new Error('<pre> not found');

      // Use scrollWidth/Height to get full rendered size, not clipped client box
      const w = Math.ceil(pre.scrollWidth);
      const h = Math.ceil(pre.scrollHeight);

      // Optional: ensure it's fully on-screen in case any transforms apply
      pre.scrollIntoView({ block: 'start', inline: 'start' });

      return { w, h };
    });

    // Safety limits (Chromium hard caps near 16384px in either dimension)
    const MAX = 15000;
    const width = Math.min(w, MAX);
    const height = Math.min(h, MAX);

    // 4) Set the viewport to the exact element size and capture once
    //    Use a 2x scale for sharper pixels without larger CSS sizes.
    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    // Add a small delay to settle fonts/layout in prod
    await page.evaluate(() => new Promise(r => setTimeout(r, 50)));

    // 5) Clip to the top-left; since viewport == content size, no stitching happens
    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('x-ascii-renderer', `clip-singlepass-${width}x${height}`);
    res.end(png);
  } catch (err) {
    console.error('[html-to-image] error:', err);
    res.status(500).send(err?.message || 'Render failed');
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}
