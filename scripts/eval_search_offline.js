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
import { matchQuery, parseQueryLocally, runSearch } from "../src/lib/search.js";

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
  // The words that returned nothing before the typed path was scored.
  "breakfast",
  "sandwich",
  "momos",
  "somewhere to work",
  "ice cream",
  "biryani",
  "late night snacks",
  "briyani",
  "deserts",
  "a cheap place for pizza",
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

let typedZero = 0;

console.log(
  `${"query".padEnd(26)}${"strict".padEnd(8)}${"typed".padEnd(7)}${"ask".padEnd(6)}top match`,
);
for (const q of QUERIES) {
  const intent = parseQueryLocally(q, vocab);
  const strict = strictCount(intent);
  const { results } = runSearch(cafes, intent);
  // What the box does as you type it, with no filters and no network.
  const typed = matchQuery(cafes, q);
  if (strict === 0) strictZero++;
  if (results.length === 0) relaxedZero++;
  if (typed.results.length === 0) typedZero++;
  console.log(
    `${q.padEnd(26)}${String(strict).padEnd(8)}${String(typed.results.length).padEnd(7)}${String(
      results.length,
    ).padEnd(6)}${typed.results[0]?.name || "—"}`,
  );
}

const pct = (n) => `${Math.round((100 * n) / QUERIES.length)}%`;
console.log(
  `\nDead ends — hard filters: ${strictZero}/${QUERIES.length} (${pct(strictZero)})` +
    `   typing: ${typedZero}/${QUERIES.length} (${pct(typedZero)})` +
    `   ask: ${relaxedZero}/${QUERIES.length} (${pct(relaxedZero)})`,
);

const dead = relaxedZero + typedZero;
if (dead > 0) {
  console.error(`\nFAIL: ${dead} query/path pairs returned nothing.`);
  process.exit(1);
}
console.log("PASS: every query returns at least one café on both paths.");
