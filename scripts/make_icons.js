/* global process, Buffer */
/**
 * make_icons.js — renders the favicon set from the barista sprite.
 *
 * The tab icon was Vite's default logo. This crops the mascot's head out of
 * the 256px counter sprite, sits it on a brown plate — the site's tape colour,
 * and the only background that holds the face on both a light and a dark tab
 * strip — and writes every size a browser asks for.
 *
 * Outputs (committed, so this only runs when the icon changes):
 *   public/favicon.ico        16 + 32 + 48, for the bare /favicon.ico request
 *   public/icon-32.png        the tab
 *   public/icon-192/512.png   Android home screen, via site.webmanifest
 *   public/apple-touch-icon.png  180, square: iOS rounds it itself
 *
 * Usage:  npm run icons      (needs Playwright, see make_og.js)
 */
import { createServer } from "vite";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";

const PORT = 5197;
const pub = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Needs Playwright:\n  npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

/**
 * An .ico is a 6-byte header, a 16-byte entry per image, then the images —
 * and PNG payloads are legal inside one, so no bitmap encoding is needed.
 */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.js", import.meta.url)),
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { port: PORT, strictPort: true },
  logLevel: "warn",
});
await server.listen();

const browser = await chromium.launch();
const render = async (size, { square = false } = {}) => {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.goto(
    `http://localhost:${PORT}/scripts/icons/template.html?size=${size}${square ? "&square=1" : ""}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForSelector("html[data-ready]");
  const buf = await page.locator("#icon").screenshot({ omitBackground: true });
  await page.close();
  return buf;
};

const files = [
  ["icon-32.png", 32],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];
for (const [name, size] of files) {
  writeFileSync(pub(name), await render(size));
  console.log(`  public/${name}`);
}
writeFileSync(pub("apple-touch-icon.png"), await render(180, { square: true }));
console.log("  public/apple-touch-icon.png");

const icoSizes = [16, 32, 48];
const pngs = [];
for (const size of icoSizes) pngs.push({ size, data: await render(size) });
writeFileSync(pub("favicon.ico"), ico(pngs));
console.log(`  public/favicon.ico (${icoSizes.join(", ")})`);

await browser.close();
await server.close();
console.log(`\nDone. Source sprite: ${readFileSync(
  fileURLToPath(new URL("../src/assets/barista.png", import.meta.url)),
).length} bytes.`);
