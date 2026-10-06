import { useMemo, useState, useEffect } from "react";
import cafes from "../data/cafes.json";
import CafeCard from "../components/CafeCard";
import PixelMascot from "../components/PixelMascot";
import SpotlightCard from "../components/SpotlightCard";
import HeroBanner from "../components/HeroBanner";
import { parseQueryLocally, runSearch } from "../lib/search";

export default function Home() {
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("");
  const [query, setQuery] = useState(""); // debounced value
  const [text, setText] = useState(""); // live input
  const [highlightedId, setHighlightedId] = useState("");
  const [focusedCafe, setFocusedCafe] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const [baristaReply, setBaristaReply] = useState("");
  const [keywords, setKeywords] = useState([]); // free words kept from the query
  const [relaxNote, setRelaxNote] = useState(""); // what the search had to let go

  useEffect(() => {
    const id = setTimeout(() => setQuery(text), 200);
    return () => clearTimeout(id);
  }, [text]);

  const budgets = useMemo(
    () =>
      [...new Set(cafes.map((c) => c.price_band))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );

  const areas = useMemo(
    () =>
      [...new Set(cafes.map((c) => c.area))].sort((a, b) => a.localeCompare(b)),
    [],
  );

  const vibes = useMemo(
    () =>
      [...new Set(cafes.flatMap((c) => c.vibe_tags || []))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );

  // Headline numbers for the hero — derived, never hard-coded.
  const stats = useMemo(() => {
    const rated = cafes.filter((c) => c.rating);
    const reviews = cafes.reduce((sum, c) => sum + (c.review_count || 0), 0);
    const top = rated.reduce((m, c) => Math.max(m, c.rating), 0);
    return { count: cafes.length, areas: areas.length, reviews, top };
  }, [areas.length]);

  const filteredCafes = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = cafes.filter((cafe) => {
      const matchesSearch =
        !q ||
        cafe.name.toLowerCase().includes(q) ||
        (cafe.description || "").toLowerCase().includes(q) ||
        (Array.isArray(cafe.vibe_tags) &&
          cafe.vibe_tags.some((t) => t.toLowerCase().includes(q)));

      const matchBudget = selectedBudget
        ? cafe.price_band === selectedBudget
        : true;

      const matchArea = selectedArea ? cafe.area === selectedArea : true;

      const matchVibe = selectedVibe
        ? (cafe.vibe_tags || []).some(
            (t) => t.toLowerCase() === selectedVibe.toLowerCase(),
          )
        : true;

      // Words the search kept hold of ("pasta", a café's name) match loosely.
      const matchKeywords = keywords.length
        ? keywords.some((k) =>
            [
              cafe.name,
              cafe.area,
              cafe.description,
              ...(cafe.cuisines || []),
              ...(cafe.vibe_tags || []),
            ]
              .join(" ")
              .toLowerCase()
              .includes(k),
          )
        : true;

      return matchesSearch && matchBudget && matchArea && matchVibe && matchKeywords;
    });

    // Best-loved cafés first (popularity_rank: 1 = most loved)
    return result.sort(
      (a, b) => (a.popularity_rank ?? 999) - (b.popularity_rank ?? 999),
    );
  }, [query, selectedBudget, selectedArea, selectedVibe, keywords]);

  const activeFilters = useMemo(
    () =>
      [
        selectedArea && { key: "area", label: selectedArea, icon: "📍" },
        selectedVibe && { key: "vibe", label: selectedVibe, icon: "✨" },
        selectedBudget && { key: "budget", label: selectedBudget, icon: "💸" },
        keywords.length && {
          key: "keywords",
          label: keywords.join(" · "),
          icon: "🔎",
        },
      ].filter(Boolean),
    [selectedArea, selectedVibe, selectedBudget, keywords],
  );

  const clearFilter = (key) => {
    if (key === "area") setSelectedArea("");
    if (key === "vibe") setSelectedVibe("");
    if (key === "budget") setSelectedBudget("");
    if (key === "keywords") setKeywords([]);
  };

  const resetAll = () => {
    setText("");
    setQuery("");
    setSelectedBudget("");
    setSelectedArea("");
    setSelectedVibe("");
    setAiError("");
    setLastSearch("");
    setBaristaReply("");
    setKeywords([]);
    setRelaxNote("");
  };

  // Verified against the dataset — each of these returns results.
  const EXAMPLES = [
    "italian in c scheme",
    "cheap coffee",
    "best rated",
    "desserts",
  ];

  const mascotState = useMemo(() => {
    const trimmed = text.trim();
    const hasFilters = !!(selectedBudget || selectedArea || selectedVibe);
    const count = filteredCafes.length;

    if (aiLoading) return { subtitle: "Reading your request…", mood: "chill" };
    if (aiError) return { subtitle: aiError, mood: "night" };

    // The barista answered a question / off-topic input → reply in character.
    if (baristaReply) return { subtitle: baristaReply, mood: "playful" };

    // Someone is typing a sentence but hasn't searched yet → nudge, don't judge.
    if (trimmed) {
      return {
        subtitle: "Press Ask and I'll find that for you.",
        mood: "default",
      };
    }

    let subtitle =
      "Filter by budget, area, or type and I'll help you pick a spot.";
    let mood = "default";

    // No search text, no filters → gentle nudge
    if (!hasFilters) {
      subtitle =
        "Start with an area, or a cuisine like “Continental” or “Fast Food”.";
      mood = "default";
      return { subtitle, mood };
    }

    // Filters applied (set by the AI or by hand)
    if (count === 0) {
      subtitle = "Your filters are a bit too picky — try relaxing one or two.";
      mood = "night";
    } else if (selectedVibe) {
      subtitle = `Craving "${selectedVibe}"? Solid choice.`;
      mood = "playful";
    } else {
      subtitle =
        count === 1
          ? "One cosy option with these filters. Quality over quantity."
          : `Showing ${count} cafés that match your filters. Nice picks!`;
      mood = "chill";
    }

    return { subtitle, mood };
  }, [
    text,
    selectedBudget,
    selectedArea,
    selectedVibe,
    filteredCafes.length,
    aiLoading,
    aiError,
    baristaReply,
  ]);

  // Natural-language search.
  //
  // Two things changed here after measuring the data: the free words in the
  // query are kept instead of discarded, and the result is run through
  // runSearch, which relaxes a constraint rather than returning nothing. With
  // 45 cafés across 16 areas, 23 tags and 3 budgets, 91% of three-filter
  // combinations match nothing, so dead-ending was the normal case.
  const runAiSearch = async (override) => {
    const q = (typeof override === "string" ? override : text).trim();
    if (!q) return;

    setAiLoading(true);
    setAiError("");

    // Read the sentence locally first. This is instant, needs no key, and is
    // what the search falls back to if the API is unavailable.
    const local = parseQueryLocally(q, { areas, types: vibes, budgets });
    let intent = local;

    try {
      const res = await fetch("/api/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, areas, types: vibes, budgets }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();

      // If the barista answered a question (who are you / what do you do /
      // off-topic), show that reply and don't touch the filters.
      if (data.reply && !data.area && !data.type && !data.budget) {
        setBaristaReply(data.reply);
        setText("");
        setQuery("");
        return;
      }
      setBaristaReply("");

      // Only accept values that actually exist in our filter lists.
      const inList = (val, list) =>
        (val &&
          list.find((x) => x.toLowerCase() === String(val).toLowerCase())) ||
        "";

      // The model leads; the local read fills anything it missed.
      intent = {
        area: inList(data.area, areas) || local.area,
        type: inList(data.type, vibes) || local.type,
        budget: inList(data.budget, budgets) || local.budget,
        keywords: local.keywords,
      };
    } catch {
      // No key, rate limit, bad JSON — the local read still answers.
      setBaristaReply("");
    }

    const { applied, droppedLabels } = runSearch(cafes, intent);

    // Apply what survived, so the chips show exactly what is being filtered.
    setSelectedArea(applied.area);
    setSelectedVibe(applied.type);
    setSelectedBudget(applied.budget);
    setKeywords(droppedLabels.includes("those words") ? [] : intent.keywords);

    setRelaxNote(
      droppedLabels.length
        ? `Nothing matched exactly, so I ignored ${droppedLabels.join(" and ")}.`
        : "",
    );

    setLastSearch(q);
    setText("");
    setQuery("");
    setAiLoading(false);
  };

  const handleSurprise = () => {
    const pool = filteredCafes.length ? filteredCafes : cafes;
    if (!pool.length) return;

    const randomCafe = pool[Math.floor(Math.random() * pool.length)];

    setHighlightedId(randomCafe.id);

    // Scroll that card into view
    const el = document.getElementById(randomCafe.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setFocusedCafe(randomCafe);

    // Remove highlight after a short moment
    setTimeout(() => setHighlightedId(""), 1500);
  };

  return (
    <main className="page-shell min-h-screen">
      <div className="mx-auto max-w-6xl space-y-[clamp(1.5rem,3.4vw,2rem)]">
        {/* ── HERO BANNER ── */}
        <HeroBanner>
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-100 backdrop-blur-sm">
              ☕ Jaipur · {stats.count} cafés
            </span>

            <h1 className="banner-title mt-3 font-display font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              Find where Jaipur
              <br />
              <span className="text-amber-200">actually drinks</span>
            </h1>

            <p className="banner-sub mt-3 max-w-md leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              Ranked by real ratings and{" "}
              <strong className="font-bold text-white">
                {stats.reviews.toLocaleString()}
              </strong>{" "}
              reviews — not ads. Ask in plain English, or filter by hand.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <button
                onClick={handleSurprise}
                className="btn-primary rounded-full px-6 py-3 text-sm font-bold"
              >
                🎲 Surprise me
              </button>
              <span className="text-xs font-semibold text-white/85">
                {stats.areas} areas · up to {stats.top}★
              </span>
            </div>
          </div>
        </HeroBanner>

        {/* ── SEARCH ── */}
        <section className="mx-auto max-w-4xl">
          <div className="panel search-grid rounded-2xl p-3">
            <label className="sr-only" htmlFor="search">
              Search cafés
            </label>
            <div className="search-field relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base"
              >
                🔎
              </span>
              <input
                id="search"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (text.trim() && !aiLoading) runAiSearch();
                  }
                }}
                placeholder="Try: italian in C Scheme, or cheap coffee"
                className="w-full rounded-xl border border-edge bg-white py-3 pl-10 pr-3 text-[15px] text-deep placeholder:text-subtle focus-visible:border-honey-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey/50"
              />
            </div>
            <button
              onClick={runAiSearch}
              disabled={aiLoading || !text.trim()}
              className="btn-primary rounded-xl px-5 py-3 text-sm font-bold"
            >
              {aiLoading ? "Thinking…" : "✨ Ask"}
            </button>
            <button
              onClick={resetAll}
              className="btn-ghost rounded-xl px-4 py-3 text-sm font-semibold"
              aria-label="Clear search and filters"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Examples, so it is obvious what the search understands. */}
        <section className="-mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-faint">
            Try
          </span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => runAiSearch(ex)}
              disabled={aiLoading}
              className="rounded-full border border-edge bg-surface px-3 py-1 text-xs font-semibold text-cocoa transition hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-soft disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </section>

        {/* ── FILTER BAR ── */}
        <section className="mx-auto max-w-4xl">
          <div className="panel filter-grid rounded-2xl p-3">
            <FilterPill
              label="Budget"
              icon="💸"
              id="budget"
              value={selectedBudget}
              onChange={setSelectedBudget}
              options={budgets}
              placeholder="All Budgets"
            />
            <FilterPill
              label="Area"
              icon="📍"
              id="area"
              value={selectedArea}
              onChange={setSelectedArea}
              options={areas}
              placeholder="All Areas"
            />
            <FilterPill
              label="Type"
              icon="✨"
              id="vibe"
              value={selectedVibe}
              onChange={setSelectedVibe}
              options={vibes}
              placeholder="All Types"
            />
          </div>
        </section>

        {/* ── RESULTS HEADER ── */}
        <section className="results-head">
          <div>
            <h2 className="font-display text-2xl font-bold text-deep">
              {filteredCafes.length}{" "}
              {filteredCafes.length === 1 ? "café" : "cafés"}
            </h2>
            {lastSearch ? (
              <>
                <p className="mt-1 text-sm text-muted">
                  for “
                  <span className="font-semibold text-deep">{lastSearch}</span>”
                </p>
                {relaxNote && (
                  <p className="mt-1 text-xs font-semibold text-cocoa">
                    {relaxNote}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Sorted by how loved they actually are
              </p>
            )}

            {activeFilters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => clearFilter(f.key)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-honey-deep/40 bg-honey/20 px-3 py-1 text-xs font-bold text-cocoa transition hover:border-honey-deep hover:bg-honey/35"
                  >
                    <span aria-hidden="true">{f.icon}</span>
                    {f.label}
                    <span
                      aria-hidden="true"
                      className="text-sm leading-none text-cocoa/60 group-hover:text-cocoa"
                    >
                      ×
                    </span>
                    <span className="sr-only">Remove {f.label} filter</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="justify-self-stretch lg:justify-self-end">
            <PixelMascot
              subtitle={mascotState.subtitle}
              mood={mascotState.mood}
              size="sm"
            />
          </div>
        </section>

        {/* ── CAFÉ GRID ── */}
        <section>
          <div className="card-grid">
            {filteredCafes.length > 0 ? (
              filteredCafes.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  isHighlighted={highlightedId === cafe.id}
                />
              ))
            ) : (
              <div className="col-span-full rounded-card border border-dashed border-edge-strong bg-surface p-10 text-center shadow-soft">
                <div className="text-4xl" aria-hidden="true">
                  {text.trim() ? "✨" : "🫖"}
                </div>
                <p className="mt-3 font-display text-xl font-bold text-deep">
                  {text.trim() ? "Ready when you are" : "Nothing matches that"}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  {text.trim()
                    ? "Press Ask and I'll turn that sentence into filters."
                    : "Those filters are a little too narrow. Try loosening one."}
                </p>
                {!text.trim() && activeFilters.length > 0 && (
                  <button
                    onClick={resetAll}
                    className="btn-primary mt-5 rounded-full px-5 py-2 text-sm font-bold"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {focusedCafe && (
          <SpotlightCard
            cafe={focusedCafe}
            onClose={() => setFocusedCafe(null)}
          />
        )}
      </div>
    </main>
  );
}

function FilterPill({
  label,
  icon,
  id,
  value,
  onChange,
  options,
  placeholder,
}) {
  const active = !!value;

  return (
    <label
      htmlFor={id}
      className={`
        flex w-full cursor-pointer items-center gap-2
        rounded-full border px-3.5 py-2
        text-xs transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-soft
        ${
          active
            ? "border-honey-deep bg-honey/25 text-cocoa shadow-soft"
            : "border-edge bg-surface text-muted"
        }
      `}
    >
      <span className="text-sm" aria-hidden="true">
        {icon}
      </span>
      <span className="shrink-0 font-bold">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          min-w-0 flex-1 cursor-pointer border-none bg-transparent
          text-[11px] focus:outline-none focus:ring-0
          ${active ? "font-bold text-cocoa" : "font-normal text-muted"}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
