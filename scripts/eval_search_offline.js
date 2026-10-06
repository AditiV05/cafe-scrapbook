/* global process */
/**
 * eval_search_offline.js — how often does a search dead-end?
 *
 * The existing eval_search.js measures whether the model maps a sentence to the
 * right filters. It needs a key, the network and the deployed function, and it
 * answers a different question from the one users actually hit: given the
 * filters, is there anything left to show?
 *
 * With 45 cafés over 16 areas, 23 tags and 3 budgets, that question matters
 * more. This runs the golden set through the local parser and the relaxing
 * matcher, needs nothing but node, and reports the dead-end rate.
 *
 * Usage:  node scripts/eval_search_offline.js
 */
import { readFileSync } from "node:fs";
import { parseQueryLocally, runSearch } from "../src/lib/search.js";

const cafes = JSON.parse(
  readFileSync(new URL("../src/data/cafes.json", import.meta.url), "utf8"),
);
const vocab = {
  areas: [...new Set(cafes.map((c) => c.area))],
  types: [...new Set(cafes.flatMap((c) => c.vibe_tags || []))],
  budgets: ["₹", "₹₹", "₹₹₹"],
};

const QUERIES = [
  "italian in c scheme",
  "cheap coffee",
  "best rated",
  "desserts",
  "pasta",
  "pure veg near vaishali nagar",
  "continental in malviya nagar",
  "somewhere fancy",
  "thai in durgapura",
  "premium italian in malviya nagar",
  "Tapri",
  "chinese",
  "burgers",
  "a place for cake",
  "drinks in c scheme",
  "cheap café in C Scheme",
  "bakery in gopalpura",
  "north indian",
  "somewhere for a date",
  "rooftop vibes",
];

// What the old behaviour did: AND the filters, show nothing if empty.
function strictCount(intent) {
  return cafes.filter(
    (c) =>
      (!intent.area || c.area === intent.area) &&
      (!intent.budget || c.price_band === intent.budget) &&
      (!intent.type ||
        (c.vibe_tags || []).some(
          (t) => t.toLowerCase() === intent.type.toLowerCase(),
        )),
  ).length;
}

let strictZero = 0;
let relaxedZero = 0;

console.log(
  `${"query".padEnd(34)}${"strict".padEnd(8)}${"now".padEnd(6)}relaxed`,
);
for (const q of QUERIES) {
  const intent = parseQueryLocally(q, vocab);
  const strict = strictCount(intent);
  const { results, droppedLabels } = runSearch(cafes, intent);
  if (strict === 0) strictZero++;
  if (results.length === 0) relaxedZero++;
  console.log(
    `${q.padEnd(34)}${String(strict).padEnd(8)}${String(results.length).padEnd(6)}${
      droppedLabels.join(", ") || "—"
    }`,
  );
}

const pct = (n) => `${Math.round((100 * n) / QUERIES.length)}%`;
console.log(
  `\nDead ends — before: ${strictZero}/${QUERIES.length} (${pct(strictZero)})` +
    `   after: ${relaxedZero}/${QUERIES.length} (${pct(relaxedZero)})`,
);

if (relaxedZero > 0) {
  console.error(`\nFAIL: ${relaxedZero} queries returned nothing.`);
  process.exit(1);
}
console.log("PASS: every query returns at least one café.");
