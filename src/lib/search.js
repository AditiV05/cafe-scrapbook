// ── Café search ──
//
// Why this exists: the app has 45 cafés spread over 16 areas, 23 vibe tags and
// 3 budgets. Hard-ANDing those three filters searches a space of ~1,100
// combinations with 45 items in it, so 77% of area+type pairs and 91% of
// area+type+budget triples match nothing at all. That is why a natural-language
// search only worked if you happened to name a combination that exists.
//
// Budget is the worst offender: 37 of 45 cafés are ₹₹, so any budget word
// other than "mid" throws away most of the list on its own.
//
// So the search relaxes instead of dead-ending. It drops the least important
// constraint, then the next, until something matches, and reports what it let
// go so the UI can say so plainly.

const BUDGET_WORDS = [
  [/\b(cheap|budget|affordable|inexpensive|pocket.?friendly|low.?cost)\b/, "₹"],
  [/\b(mid|moderate|reasonable|mid.?range)\b/, "₹₹"],
  [/\b(fancy|premium|expensive|upscale|posh|fine.?dining|splurge|luxur)\w*\b/, "₹₹₹"],
];

// Everyday words the vocabulary does not contain. Without these, "pasta"
// matched nothing and "best rated" matched every café (every description
// contains the word "Rated").
const SYNONYMS = [
  [/\b(pasta|pizza|lasagn\w*|risotto)\b/, "Italian"],
  [/\b(coffee|espresso|latte|cappuccino|brew|chai|tea)\b/, "Beverages"],
  [/\b(dessert\w*|cake|sweet|pastry|pastries|ice.?cream)\b/, "Desserts"],
  [/\b(bakery|bakes|bread|croissant)\b/, "Bakery"],
  [/\b(burger\w*|fries|sandwich\w*|wrap|quick.?bite)\b/, "Fast Food"],
  [/\b(veg|vegetarian|veggie)\b/, "Pure Veg"],
  [/\b(best|top|highest|popular|loved|famous|highly.?rated|well.?rated)\b/, "Highly Rated"],
  [/\b(drinks|cocktail\w*|beer|pub)\b/, "Bar"],
  [/\b(noodles|dumpling\w*|momo\w*)\b/, "Chinese"],
];

const STOPWORDS = new Set([
  "a","an","the","in","at","on","for","to","of","and","or","me","my","i","is",
  "any","some","place","places","spot","spots","cafe","cafes","café","cafés",
  "near","around","somewhere","something","good","nice","best","show","find",
  "want","looking","with","that","this","like","please","jaipur",
  "food","eat","go","get","try","out","area","vibe","vibes","rated",
]);

/**
 * Reads a sentence against the app's own vocabulary — no network, no key.
 * Handles the common shapes ("italian in c scheme", "cheap coffee") on its own,
 * which also means search still works when the AI endpoint is down or rate
 * limited, instead of falling back to "use the dropdowns".
 */
export function parseQueryLocally(query, { areas = [], types = [], budgets = [] } = {}) {
  const q = ` ${String(query || "").toLowerCase().replace(/[^\w₹\s]/g, " ")} `;

  // Longest name first, so "Malviya Nagar" wins over a bare "nagar".
  const longestMatch = (list) =>
    [...list]
      .sort((a, b) => b.length - a.length)
      .find((v) => q.includes(` ${v.toLowerCase()} `) || q.includes(` ${v.toLowerCase()},`)) || "";

  const area = longestMatch(areas);
  // A literal vocabulary word wins; otherwise fall back to a synonym.
  let type = longestMatch(types);
  if (!type) {
    for (const [re, mapped] of SYNONYMS) {
      if (re.test(q) && types.includes(mapped)) {
        type = mapped;
        break;
      }
    }
  }

  let budget = budgets.find((b) => q.includes(b)) || "";
  if (!budget) {
    for (const [re, band] of BUDGET_WORDS) {
      if (re.test(q) && budgets.includes(band)) {
        budget = band;
        break;
      }
    }
  }

  // Whatever is left over is a keyword ("pasta", "rooftop", a café's name).
  let rest = q;
  for (const taken of [area, type]) {
    if (taken) rest = rest.replace(taken.toLowerCase(), " ");
  }
  const keywords = rest
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .filter((w) => !BUDGET_WORDS.some(([re]) => re.test(` ${w} `)));

  return { area, type, budget, keywords };
}

const hasTag = (cafe, tag) =>
  (cafe.vibe_tags || []).some((t) => t.toLowerCase() === String(tag).toLowerCase());

function haystack(cafe) {
  return [
    cafe.name,
    cafe.area,
    cafe.description,
    ...(cafe.cuisines || []),
    ...(cafe.vibe_tags || []),
  ]
    .join(" ")
    .toLowerCase();
}

function applyAll(cafes, { area, type, budget, keywords }) {
  return cafes.filter((c) => {
    if (area && c.area !== area) return false;
    if (budget && c.price_band !== budget) return false;
    if (type && !hasTag(c, type)) return false;
    if (keywords && keywords.length) {
      const hay = haystack(c);
      if (!keywords.some((k) => hay.includes(k))) return false;
    }
    return true;
  });
}

const byRank = (a, b) =>
  (a.popularity_rank ?? 999) - (b.popularity_rank ?? 999);

// Which constraint to give up first is decided by the data, not a fixed
// order: whichever one matches the fewest cafés on its own is the most likely
// reason nothing came back. "cheap coffee" is the case that proves it — the
// literal "Coffee" tag covers 1 café while ₹ covers 5, so the tag goes, not
// the budget. Ties break towards keeping the cuisine, which is usually the
// actual intent.
const TIE_BREAK = { keywords: 0, budget: 1, area: 2, type: 3 };

function supportOf(cafes, key, value) {
  if (key === "keywords") {
    if (!value.length) return Infinity;
    return cafes.filter((c) => value.some((k) => haystack(c).includes(k))).length;
  }
  if (!value) return Infinity;
  if (key === "area") return cafes.filter((c) => c.area === value).length;
  if (key === "budget") return cafes.filter((c) => c.price_band === value).length;
  return cafes.filter((c) => hasTag(c, value)).length;
}

const LABEL = {
  budget: "budget",
  keywords: "those words",
  area: "the area",
  type: "the cuisine",
};

/**
 * Runs an intent against the list, relaxing until something matches.
 * Returns the results plus which constraints survived and which were let go,
 * so the UI can explain itself rather than silently showing the wrong thing.
 */
export function runSearch(cafes, intent) {
  const active = {
    area: intent.area || "",
    type: intent.type || "",
    budget: intent.budget || "",
    keywords: intent.keywords || [],
  };

  const dropOrder = ["keywords", "budget", "area", "type"]
    .filter((k) => (k === "keywords" ? active.keywords.length > 0 : Boolean(active[k])))
    .sort((a, b) => {
      const d = supportOf(cafes, a, active[a]) - supportOf(cafes, b, active[b]);
      return d !== 0 ? d : TIE_BREAK[a] - TIE_BREAK[b];
    });

  const dropped = [];
  let results = applyAll(cafes, active);

  for (const key of dropOrder) {
    if (results.length) break;
    active[key] = key === "keywords" ? [] : "";
    dropped.push(key);
    results = applyAll(cafes, active);
  }

  return {
    results: results.sort(byRank),
    applied: { area: active.area, type: active.type, budget: active.budget },
    dropped,
    droppedLabels: dropped.map((k) => LABEL[k]),
  };
}
