// api/html-to-image.js
import chromium from '@sparticuz/chromium-min'
import puppeteerCore from 'puppeteer-core'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Use POST')

  const html =
    (typeof req.body === 'string' && req.body) ||
    (req.body && req.body.html) ||
    ''
  if (!html) return res.status(400).send('Missing html')

  let browser
  try {
    let executablePath = null
    try {
      executablePath = await chromium.executablePath() // works on Vercel prod
    } catch {
      executablePath = null // dev fallback below
    }

    if (executablePath) {
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      })
    } else {
      const puppeteer = await import('puppeteer')
      browser = await puppeteer.launch({ headless: true })
    }

    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    const buf = await page.screenshot({ type: 'png', fullPage: true })
    await browser.close()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store')
    res.send(buf)
  } catch (err) {
    if (browser) try { await browser.close() } catch {}
    console.error('[html-to-image] error:', err)
    res.status(500).send(err?.message || 'Render failed')
  }
}
