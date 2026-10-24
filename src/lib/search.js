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
  "want","looking","with","that","this","like","please","jaipur","night",
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

function applyAll(cafes, { area, type, budget, keywords }) {
  // Leftover words are scored, not string-matched, for the same reason typing
  // is: "breakfast" appears in none of the 45 blurbs but means something.
  const wordsPass = keywordTest(keywords);
  return cafes.filter((c) => {
    if (area && c.area !== area) return false;
    if (budget && c.price_band !== budget) return false;
    if (type && !hasTag(c, type)) return false;
    if (wordsPass && !wordsPass(c)) return false;
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
    const pass = keywordTest(value);
    if (!pass) return Infinity;
    return cafes.filter(pass).length;
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

// ── Typing straight into the box ──
//
// Everything above answers "what filters did they mean?" — it is built for the
// ✨ Ask button, where one sentence becomes one area + one type + one budget.
// Typing is a different problem. People type a dish ("pasta"), a meal
// ("breakfast"), or a reason ("somewhere to work"), and none of those words
// appear anywhere in the data: the vocabulary is 23 vibe tags and 24 cuisines,
// so a literal `description.includes("breakfast")` matched 0 of 45 cafés and
// `includes("pasta")` matched 2 — the two whose mascot note happens to say it.
//
// So the typed query is scored rather than filtered. Each word is expanded into
// the vocabulary it implies, matched against weighted fields (a name beats a
// tag beats a blurb), and the cafés come back best-first. Cafés matching every
// word win; if nothing does, the closest matches show instead of a dead end.

const FIELD = { name: 7, tag: 6, area: 5, auth: 3, text: 2 };

// Everyday words mapped onto vocabulary that actually exists in the data.
// Values are matched like any other term, so a phrase ("north indian") hits the
// whole tag and scores higher than one of its words.
const TOPIC = {
  // meals and times of day
  breakfast: ["bakery", "coffee", "beverages"],
  brunch: ["bakery", "continental", "coffee"],
  morning: ["coffee", "bakery"],
  lunch: ["north indian", "continental", "biryani"],
  dinner: ["north indian", "mughlai", "continental"],
  snack: ["street food", "fast food", "momos"],
  snacks: ["street food", "fast food", "momos"],
  "late night": ["fast food", "street food"],
  "quick bite": ["quick bites", "fast food"],
  takeaway: ["quick bites", "fast food"],

  // dishes
  pasta: ["italian"],
  pastas: ["italian"],
  lasagna: ["italian"],
  lasagne: ["italian"],
  risotto: ["italian"],
  ravioli: ["italian"],
  alfredo: ["italian"],
  penne: ["italian"],
  pizza: ["pizza", "italian"],
  pizzas: ["pizza", "italian"],
  "garlic bread": ["pizza", "italian"],
  burger: ["fast food"],
  burgers: ["fast food"],
  fries: ["fast food"],
  nuggets: ["fast food"],
  sandwich: ["fast food", "bakery"],
  sandwiches: ["fast food", "bakery"],
  toast: ["bakery", "continental"],
  panini: ["fast food", "bakery"],
  wrap: ["fast food", "street food"],
  wraps: ["fast food", "street food"],
  roll: ["fast food", "street food"],
  rolls: ["fast food", "street food"],
  maggi: ["street food", "beverages"],
  chai: ["beverages", "street food"],
  tea: ["beverages"],
  coffee: ["coffee", "beverages"],
  espresso: ["coffee", "beverages"],
  latte: ["coffee", "beverages"],
  cappuccino: ["coffee", "beverages"],
  mocha: ["coffee", "beverages"],
  americano: ["coffee", "beverages"],
  frappe: ["coffee", "beverages"],
  brew: ["coffee", "beverages"],
  "cold coffee": ["coffee", "beverages"],
  shake: ["beverages"],
  shakes: ["beverages"],
  milkshake: ["beverages"],
  smoothie: ["beverages"],
  juice: ["beverages"],
  mocktail: ["beverages"],
  mocktails: ["beverages"],
  lemonade: ["beverages"],
  cake: ["desserts", "bakery"],
  cakes: ["desserts", "bakery"],
  pastry: ["desserts", "bakery"],
  pastries: ["desserts", "bakery"],
  dessert: ["desserts"],
  desserts: ["desserts"],
  sweet: ["desserts"],
  sweets: ["desserts"],
  brownie: ["desserts", "bakery"],
  brownies: ["desserts", "bakery"],
  waffle: ["desserts", "bakery"],
  waffles: ["desserts", "bakery"],
  pancake: ["desserts", "bakery"],
  pancakes: ["desserts", "bakery"],
  donut: ["desserts", "bakery"],
  donuts: ["desserts", "bakery"],
  cheesecake: ["desserts", "bakery"],
  tiramisu: ["desserts", "italian"],
  cookie: ["bakery", "desserts"],
  cookies: ["bakery", "desserts"],
  "ice cream": ["ice cream", "desserts"],
  icecream: ["ice cream", "desserts"],
  gelato: ["ice cream", "desserts"],
  sundae: ["ice cream", "desserts"],
  croissant: ["bakery"],
  croissants: ["bakery"],
  bread: ["bakery"],
  bakes: ["bakery"],
  muffin: ["bakery"],
  muffins: ["bakery"],
  sourdough: ["bakery"],
  biryani: ["biryani", "mughlai"],
  biriyani: ["biryani", "mughlai"],
  pulao: ["biryani", "north indian"],
  kebab: ["mughlai", "north indian"],
  kebabs: ["mughlai", "north indian"],
  tikka: ["mughlai", "north indian"],
  tandoori: ["mughlai", "north indian"],
  "butter chicken": ["mughlai", "north indian"],
  curry: ["north indian", "mughlai"],
  paneer: ["north indian", "pure veg"],
  dal: ["north indian", "pure veg"],
  roti: ["north indian"],
  naan: ["north indian", "mughlai"],
  thali: ["north indian", "pure veg"],
  chaat: ["street food"],
  golgappa: ["street food"],
  samosa: ["street food"],
  kachori: ["street food"],
  pakora: ["street food"],
  dosa: ["south indian"],
  idli: ["south indian"],
  vada: ["south indian"],
  uttapam: ["south indian"],
  sambar: ["south indian"],
  momo: ["momos", "asian"],
  momos: ["momos", "asian"],
  dumpling: ["momos", "asian"],
  dumplings: ["momos", "asian"],
  noodles: ["chinese", "asian"],
  hakka: ["chinese", "asian"],
  manchurian: ["chinese", "asian"],
  schezwan: ["chinese", "asian"],
  "fried rice": ["chinese", "asian"],
  ramen: ["asian", "thai"],
  "pad thai": ["thai", "asian"],
  sushi: ["sushi", "asian"],
  sashimi: ["sushi", "asian"],
  taco: ["mexican"],
  tacos: ["mexican"],
  nachos: ["mexican"],
  burrito: ["mexican"],
  quesadilla: ["mexican"],
  hummus: ["lebanese"],
  falafel: ["lebanese"],
  shawarma: ["lebanese"],
  pita: ["lebanese"],
  mezze: ["lebanese"],
  steak: ["continental", "european"],
  salad: ["continental", "european"],

  // how they eat
  veg: ["pure veg"],
  vegetarian: ["pure veg"],
  veggie: ["pure veg"],
  vegan: ["pure veg"],
  jain: ["pure veg"],
  "pure veg": ["pure veg"],
  chicken: ["mughlai", "north indian"],
  mutton: ["mughlai", "north indian"],

  // why they are going
  work: ["coffee", "beverages"],
  working: ["coffee", "beverages"],
  laptop: ["coffee", "beverages"],
  wifi: ["coffee", "beverages"],
  study: ["coffee", "beverages"],
  studying: ["coffee", "beverages"],
  quiet: ["coffee", "beverages"],
  meeting: ["coffee", "continental"],
  date: ["italian", "continental", "fine dining"],
  romantic: ["italian", "continental", "fine dining"],
  anniversary: ["fine dining", "continental"],
  friends: ["casual dining", "street food", "fast food"],
  hangout: ["casual dining", "street food", "fast food"],
  chill: ["casual dining", "coffee"],
  casual: ["casual dining"],
  family: ["pure veg", "north indian", "casual dining"],
  kids: ["desserts", "pure veg"],
  party: ["bar", "fine dining"],
  celebration: ["fine dining", "desserts"],
  drinks: ["bar"],
  cocktail: ["bar"],
  cocktails: ["bar"],
  beer: ["bar"],
  pub: ["bar"],
  alcohol: ["bar"],
  wine: ["bar"],
  brewery: ["bar"],
  classy: ["fine dining"],
  elegant: ["fine dining"],

  // "is it any good"
  best: ["highly rated"],
  top: ["highly rated"],
  popular: ["highly rated"],
  famous: ["highly rated"],
  loved: ["highly rated"],
  trending: ["highly rated"],
  recommended: ["highly rated"],
  hyped: ["highly rated"],
  favourite: ["highly rated"],
  favorite: ["highly rated"],
  "highly rated": ["highly rated"],
  "well rated": ["highly rated"],
  "must visit": ["highly rated"],
};

// Words the boilerplate blurb contains ("Rated 4.9/5 across 3,123+ dining
// reviews"), so a literal match on them means nothing. Their TOPIC meaning is
// kept; only the text match is dropped. This is why "best rated" used to
// return all 45.
const NOISE = new Set([
  "best", "top", "popular", "famous", "loved", "trending", "recommended",
  "rated", "dining", "reviews", "known", "visit", "must", "hyped",
  "favourite", "favorite",
]);

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Every strong term seen so far, for the typo pass below. Filled as cafés are
// indexed, which happens on the first query over the full list.
const KNOWN = new Set();

function put(map, term, weight) {
  if (!term || term.length < 2) return;
  if ((map.get(term) || 0) < weight) map.set(term, weight);
}

function putWords(map, value, weight) {
  for (const w of normalize(value).split(" ")) put(map, w, weight);
}

function buildIndex(cafe) {
  const map = new Map();
  put(map, normalize(cafe.name), FIELD.name);
  putWords(map, cafe.name, FIELD.name);
  for (const v of [...(cafe.cuisines || []), ...(cafe.vibe_tags || [])]) {
    put(map, normalize(v), FIELD.tag);
    putWords(map, v, FIELD.tag - 1);
  }
  put(map, normalize(cafe.area), FIELD.area);
  putWords(map, cafe.area, FIELD.area - 1);
  put(map, normalize(cafe.authenticity), FIELD.auth);
  putWords(map, cafe.authenticity, FIELD.auth);
  putWords(map, cafe.description, FIELD.text);
  putWords(map, cafe.mascot_note, FIELD.text);

  for (const [term, weight] of map) if (weight >= FIELD.area) KNOWN.add(term);
  return map;
}

const INDEX = new WeakMap();

function indexFor(cafe) {
  let i = INDEX.get(cafe);
  if (!i) {
    i = buildIndex(cafe);
    INDEX.set(cafe, i);
  }
  return i;
}

// Phrases worth reading as one token, longest first: "ice cream" is not "ice"
// plus "cream", and "c scheme" is not "c" plus "scheme".
const PHRASES = Object.keys(TOPIC)
  .filter((k) => k.includes(" "))
  .sort((a, b) => b.length - a.length);

function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

const FUZZY = new Map();

// "briyani", "italain", "deserts" — one slip shouldn't empty the board.
function nearestKnown(token) {
  if (token.length < 5) return "";
  if (FUZZY.has(token)) return FUZZY.get(token);
  const max = token.length >= 7 ? 2 : 1;
  let best = "";
  let bestD = max + 1;
  for (const term of KNOWN) {
    if (term.includes(" ")) continue;
    const d = editDistance(token, term, max);
    if (d < bestD) {
      bestD = d;
      best = term;
    }
  }
  FUZZY.set(token, best);
  return best;
}

const singular = (w) =>
  w.length > 4 && w.endsWith("es") ? w.slice(0, -2)
  : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1)
  : "";

/**
 * Turns a typed sentence into scorable tokens. Each token carries the terms it
 * implies and, where a word means a field rather than a word (a budget, a diet),
 * a predicate that reads that field directly.
 */
export function tokenize(query) {
  let q = ` ${normalize(query)} `;
  if (q.trim() === "") return [];

  const raws = [];
  for (const phrase of PHRASES) {
    if (q.includes(` ${phrase} `)) {
      raws.push(phrase);
      q = q.replace(` ${phrase} `, "  ");
    }
  }
  raws.push(...q.split(" ").filter(Boolean));

  const tokens = [];
  const seen = new Set();
  for (const raw of raws) {
    if (raw.length < 2 || seen.has(raw)) continue;
    seen.add(raw);

    const terms = [];
    const predicates = [];

    const topic = TOPIC[raw] || TOPIC[singular(raw)];
    if (topic) for (const t of topic) terms.push([t, 1]);

    // A budget is a qualifier, not a subject: 37 of 45 cafés are ₹₹, so it
    // scores below a cuisine and never outranks it when ordering results.
    const band = BUDGET_WORDS.find(([re]) => re.test(` ${raw} `));
    if (band) predicates.push((c) => (c.price_band === band[1] ? FIELD.auth : 0));

    if (/^(veg|vegetarian|veggie|vegan|jain)$/.test(raw)) {
      predicates.push((c) => (c.veg_nonveg === "Veg" ? FIELD.tag : 0));
    }

    if (!NOISE.has(raw)) {
      terms.push([raw, 1]);
      const stem = singular(raw);
      if (stem) terms.push([stem, 0.95]);
      if (!KNOWN.has(raw)) {
        const near = nearestKnown(raw);
        if (near && near !== raw) terms.push([near, 0.7]);
      }
    }

    // Nothing to go on and nothing but filler: ignore the word entirely rather
    // than let it zero out the whole query.
    if (!terms.length && !predicates.length) continue;
    if (!topic && !predicates.length && STOPWORDS.has(raw)) continue;

    // What kind of word this is, for picking the one to insist on when no café
    // satisfies them all: a dish or a place beats a diet, which beats "cheap"
    // or "best". Without this, "a cheap place for pizza" with no cheap pizza
    // in the data returns every cheap café interleaved with every pizza one.
    const klass = band || NOISE.has(raw) ? 1 : predicates.length ? 2 : 3;
    tokens.push({ raw, terms, predicates, klass });
  }
  return tokens;
}

function termScore(index, term) {
  const exact = index.get(term);
  if (exact) return exact;
  let best = 0;
  for (const [key, weight] of index) {
    if (key === term) continue;
    if (key.startsWith(term)) best = Math.max(best, weight * 0.9);
    else if (key.length >= 4 && term.startsWith(key))
      best = Math.max(best, weight * 0.85);
  }
  return best;
}

function tokenScore(cafe, index, token) {
  let best = 0;
  for (const p of token.predicates) best = Math.max(best, p(cafe));
  for (const [term, factor] of token.terms)
    best = Math.max(best, termScore(index, term) * factor);
  return best;
}

/**
 * Scores a typed query against a list of cafés.
 *
 * Cafés matching every word come first. If none do, the closest partial matches
 * are returned with a note saying so — a short list of near misses is more use
 * than "nothing matches that".
 */
export function matchQuery(cafes, query) {
  const tokens = tokenize(query);
  if (!tokens.length) return { results: [...cafes].sort(byRank), note: "", tokens };

  const counts = tokens.map(() => 0);
  const scored = [];
  for (const cafe of cafes) {
    const index = indexFor(cafe);
    const scores = tokens.map((t) => tokenScore(cafe, index, t));
    let total = 0;
    let hits = 0;
    scores.forEach((s, i) => {
      if (s > 0) {
        total += s;
        hits++;
        counts[i]++;
      }
    });
    if (total > 0) scored.push({ cafe, scores, total, hits });
  }

  // Keep only the cafés that matched as many of the words as anything did. For
  // "premium italian in malviya nagar" nothing matches all three, and every
  // café matching any one of them is 28 of 45 — a list that answers nothing.
  // The best-achievable count lands on the handful that got two of three.
  const reached = Math.max(0, ...scored.map((x) => x.hits));
  let pool = scored.filter((x) => x.hits === reached);

  // Short of a clean sweep, one word still has to hold: the most specific one
  // that matches anything, so the list is about something.
  if (reached < tokens.length && pool.length > 1) {
    const anchor = tokens
      .map((t, i) => ({ i, klass: t.klass, count: counts[i] }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.klass - a.klass || a.count - b.count)[0];
    if (anchor) {
      const held = pool.filter((x) => x.scores[anchor.i] > 0);
      if (held.length) pool = held;
    }
  }

  pool.sort((a, b) => b.total - a.total || byRank(a.cafe, b.cafe));

  return {
    results: pool.map((x) => x.cafe),
    note:
      reached === tokens.length || !pool.length
        ? ""
        : "No café matched all of that, so here are the closest.",
    tokens,
  };
}

/**
 * A predicate for leftover query words, shared by the relaxing matcher above
 * so the ✨ Ask path and plain typing agree on what a word means.
 * Returns null when there is nothing to test.
 */
export function keywordTest(keywords) {
  const tokens = tokenize((keywords || []).join(" "));
  if (!tokens.length) return null;
  return (cafe) => {
    const index = indexFor(cafe);
    return tokens.some((t) => tokenScore(cafe, index, t) > 0);
  };
}
