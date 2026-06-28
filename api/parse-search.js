/* global process */
// api/parse-search.js
// Vercel serverless function: turns a natural-language café search
// into structured filters { budget, area, type } using Gemini.

// ── Simple in-memory cache ──
// Remembers recent query→result pairs so repeated searches skip the Gemini
// call (and don't burn through the rate limit). Note: serverless functions
// reset when idle, so this helps within an active session, not forever —
// which is exactly the "searched a few things quickly" case we care about.
const cache = new Map();
const CACHE_MAX = 100; // cap entries so memory can't grow unbounded

function cacheKey(query) {
  return query.trim().toLowerCase();
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, areas = [], types = [], budgets = [] } = req.body || {};

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing query" });
  }

  // ── Cache check: same sentence? return the saved answer, skip Gemini ──
  const key = cacheKey(query);
  if (cache.has(key)) {
    return res.status(200).json(cache.get(key));
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing API key" });
  }

  // The prompt: give Gemini the user's sentence + the exact vocabulary
  // it's allowed to choose from, and force a strict JSON reply.
  const prompt = `You convert a café search sentence into filters.

Allowed areas: ${areas.join(", ")}
Allowed types: ${types.join(", ")}
Allowed budgets: ${budgets.join(", ")} (₹ = cheap, ₹₹ = mid, ₹₹₹ = premium)

Rules:
- Only use values from the allowed lists above. If unsure, use null.
- "cheap/affordable/budget" → ₹ ; "mid/moderate" → ₹₹ ; "premium/fancy/expensive" → ₹₹₹
- Match area and type loosely (e.g. "continental food" → the Continental type).
- Return ONLY raw JSON, no markdown, no explanation.

Sentence: "${query}"

Return JSON shaped exactly like: {"area": string|null, "type": string|null, "budget": string|null, "keywords": string}`;

  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      apiKey;

    const gemRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!gemRes.ok) {
      const detail = await gemRes.text();
      return res.status(502).json({ error: "Gemini call failed", detail });
    }

    const data = await gemRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    // Parse the model's JSON safely
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "Bad JSON from model", raw: text });
    }

    // ── Save to cache before returning ──
    if (cache.size >= CACHE_MAX) {
      // drop the oldest entry to keep size bounded
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, parsed);

    return res.status(200).json(parsed);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Unexpected error", detail: String(err) });
  }
}
