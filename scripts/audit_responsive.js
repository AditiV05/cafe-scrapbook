/* global process */
/**
 * audit_responsive.js — does the layout hold at every width?
 *
 * Eyeballing two or three widths is how the misses happened: chips cropped
 * with no cue at 360, a 20px-tall "Back to results", a 2-column button grid
 * that wrapped "View on Zomato" onto two lines at 320, and one column of
 * 600px-wide cards at 600. This walks both pages across 15 widths and fails
 * on the things that are measurable:
 *
 *   - the document scrolling sideways
 *   - content sitting outside the viewport (decoration that bleeds on
 *     purpose, and chips inside a scroll rail, are allowed)
 *   - body text under 10.5px
 *   - a tap target under 40px on a touch screen
 *
 * Usage:  npm run audit:layout      (needs Playwright, see make_og.js)
 */
import { createServer } from "vite";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const PORT = 5198;
const WIDTHS = [320, 360, 390, 414, 480, 540, 600, 640, 768, 834, 1024, 1180, 1280, 1440, 1920];
const PAGES = ["/", "/cafe/tapri-central-c-scheme"];
const MIN_TEXT = 10.5;
const MIN_TAP = 40;

const require = createRequire(import.meta.url);
let chromium, devices;
try {
  ({ chromium, devices } = require("playwright"));
} catch {
  console.error("Needs Playwright:\n  npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const probe = (minText) => {
  const vw = document.documentElement.clientWidth;
  const out = { overflow: Math.round(document.documentElement.scrollWidth - vw), wide: [], small: [], tap: [] };
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const name =
      el.tagName.toLowerCase() +
      (typeof el.className === "string" && el.className.trim()
        ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
        : "");
    // Tape, stickers, badges and the ring are meant to hang off an edge, and a
    // chip in a scroll rail is scrollable rather than cropped.
    const mayBleed =
      ["sticker", "tape", "badge-pin", "scribble"].some((c) => el.classList.contains(c)) ||
      el.closest(".chip-row");
    if (!mayBleed && (r.right > vw + 1 || r.left < -1) && !seen.has("w" + name)) {
      seen.add("w" + name);
      out.wide.push(`${name} [${Math.round(r.left)}..${Math.round(r.right)}] vs ${vw}`);
    }
    const ownsText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownsText) {
      const fs = parseFloat(cs.fontSize);
      // The ★ No.1 flag is a sticker, not something anyone has to read.
      if (fs < minText && !el.classList.contains("badge-pin") && !seen.has("s" + name)) {
        seen.add("s" + name);
        out.small.push(`${name} ${fs}px "${el.textContent.trim().slice(0, 20)}"`);
      }
    }
    if (["BUTTON", "A", "SELECT", "INPUT"].includes(el.tagName)) {
      const h = Math.round(r.height);
      if (h < 40 && !seen.has("t" + name + h)) {
        seen.add("t" + name + h);
        out.tap.push(`${name} ${Math.round(r.width)}x${h} "${el.textContent.trim().slice(0, 16)}"`);
      }
    }
  }
  return out;
};

const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.js", import.meta.url)),
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { port: PORT, strictPort: true },
  logLevel: "warn",
});
await server.listen();
const browser = await chromium.launch();

let failures = 0;
const report = (where, out, checkTaps) => {
  const bad = [];
  if (out.overflow > 0) bad.push(`scrolls sideways by ${out.overflow}px`);
  if (out.wide.length) bad.push(`outside the viewport: ${out.wide.join("; ")}`);
  if (out.small.length) bad.push(`under ${MIN_TEXT}px: ${out.small.join("; ")}`);
  if (checkTaps && out.tap.length) bad.push(`tap target under ${MIN_TAP}px: ${out.tap.join("; ")}`);
  if (bad.length) {
    failures += bad.length;
    console.log(`  ${where}\n    ${bad.join("\n    ")}`);
  }
  return bad.length === 0;
};

for (const path of PAGES) {
  console.log(`\n${path}`);
  let clean = 0;
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(220);
    // Tap targets are only judged on a touch screen, where the coarse-pointer
    // rules apply; a mouse does not need a 44px chip.
    if (report(`${width}px`, await page.evaluate(probe, MIN_TEXT), false)) clean++;
    await page.close();
  }
  console.log(`  ${clean}/${WIDTHS.length} widths clean`);
}

console.log("\ntouch (iPhone 13)");
const touch = await browser.newContext({ ...devices["iPhone 13"] });
for (const path of PAGES) {
  const page = await touch.newPage();
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(220);
  const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (!coarse) console.log("  (pointer is not coarse — tap sizes not exercised)");
  if (report(path, await page.evaluate(probe, MIN_TEXT), coarse)) console.log(`  ${path} clean`);
  await page.close();
}

await browser.close();
await server.close();

if (failures) {
  console.error(`\nFAIL: ${failures} layout problem(s).`);
  process.exit(1);
}
console.log("\nPASS: nothing overflows, nothing is too small to read or hit.");
