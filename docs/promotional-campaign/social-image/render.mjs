// Renders og.html to the docs site's Open Graph / Twitter card image.
//   node docs/promotional-campaign/social-image/render.mjs
// Uses the Playwright install from ../promo-video (npm install there first).
import { chromium } from '../promo-video/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../../apps/docs/public/og-image.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'og.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log(`wrote ${out}`);
