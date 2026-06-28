/**
 * eval_search.js — accuracy harness for the natural-language café search.
 *
 * Runs a golden set of sentences through the deployed /api/parse-search
 * function, compares the model's structured output against expected
 * filters, and prints a per-case + overall accuracy report.
 *
 * Usage:  node scripts/eval_search.js
 *
 * Notes:
 *   - Hits the LIVE function (Vite dev server doesn't run /api routes).
 *   - Spaced ~4s apart to stay under Gemini's free-tier 15 req/min limit.
 */

const ENDPOINT = "https://cafe-scrapbook.vercel.app/api/parse-search";
const DELAY_MS = 6000; // between cases — stay under 15 req/min
const MAX_RETRIES = 3; // retry transient errors (502/429) before giving up
const RETRY_WAIT_MS = 8000;

// The vocabulary the function is allowed to choose from (mirrors the app).
const AREAS = [
  "C Scheme",
  "Malviya Nagar",
  "Vaishali Nagar",
  "Bais Godam",
  "Sodala",
  "Gopalpura",
  "Tonk Road",
  "Mansarovar",
];
const TYPES = [
  "Italian",
  "Continental",
  "Fast Food",
  "Street Food",
  "Chinese",
  "North Indian",
  "South Indian",
  "Thai",
  "Mexican",
  "Beverages",
  "Bakery",
  "Desserts",
  "Bar",
  "Pure Veg",
  "Highly Rated",
];
const BUDGETS = ["₹", "₹₹", "₹₹₹"];

// --- Golden set: input + expected filters -----------------------------------
const GOLDEN = [
  {
    q: "italian place in C Scheme",
    area: "C Scheme",
    type: "Italian",
    budget: null,
  },
  {
    q: "cheap fast food in malviya nagar",
    area: "Malviya Nagar",
    type: "Fast Food",
    budget: "₹",
  },
  {
    q: "continental food in vaishali nagar",
    area: "Vaishali Nagar",
    type: "Continental",
    budget: null,
  },
  { q: "somewhere fancy and expensive", area: null, type: null, budget: "₹₹₹" },
  { q: "budget friendly cafe", area: null, type: null, budget: "₹" },
  {
    q: "chinese in malviya nagar",
    area: "Malviya Nagar",
    type: "Chinese",
    budget: null,
  },
  { q: "pure veg place", area: null, type: "Pure Veg", budget: null },
  { q: "a bar in C Scheme", area: "C Scheme", type: "Bar", budget: null },
  {
    q: "highly rated cafe in sodala",
    area: "Sodala",
    type: "Highly Rated",
    budget: null,
  },
  { q: "mid range italian", area: null, type: "Italian", budget: "₹₹" },
  {
    q: "desserts in gopalpura",
    area: "Gopalpura",
    type: "Desserts",
    budget: null,
  },
  {
    q: "affordable north indian",
    area: null,
    type: "North Indian",
    budget: "₹",
  },
  {
    q: "premium continental for a date night",
    area: null,
    type: "Continental",
    budget: "₹₹₹",
  },
  { q: "coffee near bais godam", area: "Bais Godam", type: null, budget: null },
  { q: "thai food somewhere nice", area: null, type: "Thai", budget: null },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (v) => (v == null ? null : String(v).trim().toLowerCase());

async function callFunction(query) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          areas: AREAS,
          types: TYPES,
          budgets: BUDGETS,
        }),
      });
      // 502 (bad gateway) and 429 (rate limit) are transient — retry them
      if (res.status === 502 || res.status === 429) {
        lastErr = new Error(`HTTP ${res.status}`);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_WAIT_MS);
          continue;
        }
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(RETRY_WAIT_MS);
    }
  }
  throw lastErr;
}

// A field is correct if the model's value matches expected (case-insensitive).
function scoreCase(expected, actual) {
  const fields = ["area", "type", "budget"];
  const results = {};
  let correct = 0;
  for (const f of fields) {
    const ok = norm(expected[f]) === norm(actual?.[f]);
    results[f] = ok;
    if (ok) correct++;
  }
  return { results, correct, total: fields.length };
}

async function main() {
  console.log(
    `\nEvaluating NL search · ${GOLDEN.length} cases · endpoint: ${ENDPOINT}\n`,
  );

  let totalFields = 0;
  let correctFields = 0;
  let fullPass = 0;
  const failures = [];

  for (let i = 0; i < GOLDEN.length; i++) {
    const c = GOLDEN[i];
    let actual;
    try {
      actual = await callFunction(c.q);
    } catch (err) {
      console.log(`✗ [${i + 1}] "${c.q}" — request failed: ${err.message}`);
      failures.push({ q: c.q, reason: err.message });
      if (i < GOLDEN.length - 1) await sleep(DELAY_MS);
      continue;
    }

    const { results, correct, total } = scoreCase(c, actual);
    totalFields += total;
    correctFields += correct;
    const perfect = correct === total;
    if (perfect) fullPass++;

    const mark = perfect ? "✓" : "✗";
    console.log(`${mark} [${i + 1}] "${c.q}"`);
    if (!perfect) {
      for (const f of ["area", "type", "budget"]) {
        if (!results[f]) {
          console.log(
            `      ${f}: got ${JSON.stringify(actual?.[f] ?? null)}, expected ${JSON.stringify(c[f])}`,
          );
        }
      }
      failures.push({ q: c.q, actual });
    }

    if (i < GOLDEN.length - 1) await sleep(DELAY_MS);
  }

  const exactPct = ((fullPass / GOLDEN.length) * 100).toFixed(0);
  const fieldPct = ((correctFields / totalFields) * 100).toFixed(0);

  console.log("\n────────────────────────────────────────");
  console.log(
    `Exact-match accuracy: ${fullPass}/${GOLDEN.length} cases (${exactPct}%)`,
  );
  console.log(
    `Field-level accuracy: ${correctFields}/${totalFields} fields (${fieldPct}%)`,
  );
  console.log("────────────────────────────────────────\n");
}

main();
