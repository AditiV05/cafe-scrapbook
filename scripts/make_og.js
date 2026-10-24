/* global process */
/**
 * make_og.js — renders the link-preview image.
 *
 * The card is an HTML page (scripts/og/template.html) that links the site's
 * own stylesheet, so the paper grid, tape, highlighter and sticker in the
 * preview are the same CSS the app ships rather than a drawing of it. This
 * spins up Vite to serve it, screenshots the 1200×630 frame, and writes
 * public/og.png.
 *
 * The output is committed, so this only needs running when the card changes.
 *
 * Usage:  npm run og      (needs: npm i -D playwright && npx playwright install chromium)
 */
import { createServer } from "vite";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const PORT = 5199;
const OUT = fileURLToPath(new URL("../public/og.png", import.meta.url));

// require, not import: it also finds a globally installed Playwright, which
// ESM resolution ignores.
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error(
    "This script needs Playwright:\n" +
      "  npm i -D playwright && npx playwright install chromium",
  );
  process.exit(1);
}

const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.js", import.meta.url)),
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { port: PORT, strictPort: true },
  logLevel: "warn",
});
await server.listen();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`http://localhost:${PORT}/scripts/og/template.html`, {
  waitUntil: "networkidle",
});
// Caveat and Playfair come off the network; screenshotting before they land
// renders the whole card in the fallback face.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);

// Anything hanging past the 1200x630 frame gets cut, and a card clipped at
// the edge reads as a broken image rather than a scrapbook.
const bleed = await page.evaluate(() => {
  const frame = document.querySelector(".og").getBoundingClientRect();
  return [...document.querySelectorAll(".note, .sticker, .badge-pin")]
    .map((el) => {
      const b = el.getBoundingClientRect();
      return {
        el: el.className.split(" ")[0],
        over: Math.round(
          Math.max(
            frame.left - b.left,
            b.right - frame.right,
            frame.top - b.top,
            b.bottom - frame.bottom,
          ),
        ),
      };
    })
    .filter((x) => x.over > 0);
});
if (bleed.length) console.warn("outside the frame:", bleed);

await page.locator(".og").screenshot({ path: OUT });

await browser.close();
await server.close();
console.log(`Wrote ${OUT}`);
