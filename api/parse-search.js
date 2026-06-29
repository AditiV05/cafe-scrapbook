/* global process */
// api/parse-search.js
// Vercel serverless function: turns a natural-language café search
// into structured filters { area, type, budget, keywords }.
//
// Uses OpenAI (gpt-4o-mini) as the primary model. If OpenAI fails or has no
// key, it automatically falls back to Gemini — so the search is never fully
// down just because one provider is rate-limited or having a bad day.

// ── Simple in-memory cache ──
// Repeated identical searches skip the API call entirely. Serverless functions
// reset when idle, so this helps within an active session, not forever — which
// is exactly the "searched a few things quickly" case we care about.
const cache = new Map();
const CACHE_MAX = 100;

function cacheKey(query) {
  return query.trim().toLowerCase();
}

// Build the shared instruction prompt (same vocabulary for both providers).
function buildPrompt(query, areas, types, budgets) {
  return `You convert a café search sentence into filters.

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
}

// ── Provider 1: OpenAI (primary) ──
async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No OpenAI key");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(text);
}

// ── Provider 2: Gemini (fallback) ──
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini key");

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    apiKey;

  const res = await fetch(url, {
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

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(text);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, areas = [], types = [], budgets = [] } = req.body || {};

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing query" });
  }

  // Cache check: same sentence? return the saved answer, skip both providers.
  const key = cacheKey(query);
  if (cache.has(key)) {
    return res.status(200).json(cache.get(key));
  }

  const prompt = buildPrompt(query, areas, types, budgets);

  // Try OpenAI first; if it throws (no key, rate limit, bad JSON), fall back to Gemini.
  let parsed;
  try {
    parsed = await callOpenAI(prompt);
  } catch (openaiErr) {
    try {
      parsed = await callGemini(prompt);
    } catch (geminiErr) {
      // Both providers failed — surface a clean error so the frontend falls back to manual filters.
      return res.status(502).json({
        error: "AI providers unavailable",
        openai: String(openaiErr),
        gemini: String(geminiErr),
      });
    }
  }

  // Save to cache before returning.
  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, parsed);

  return res.status(200).json(parsed);
}
