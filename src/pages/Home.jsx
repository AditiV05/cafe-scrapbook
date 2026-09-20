import { useMemo, useState, useEffect } from "react";
import cafes from "../data/cafes.json";
import CafeCard from "../components/CafeCard";
import PixelMascot from "../components/PixelMascot";
import SpotlightCard from "../components/SpotlightCard";

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

      return matchesSearch && matchBudget && matchArea && matchVibe;
    });

    // Best-loved cafés first (popularity_rank: 1 = most loved)
    return result.sort(
      (a, b) => (a.popularity_rank ?? 999) - (b.popularity_rank ?? 999),
    );
  }, [query, selectedBudget, selectedArea, selectedVibe]);

  const activeFilters = useMemo(
    () =>
      [
        selectedArea && { key: "area", label: selectedArea, icon: "📍" },
        selectedVibe && { key: "vibe", label: selectedVibe, icon: "✨" },
        selectedBudget && { key: "budget", label: selectedBudget, icon: "💸" },
      ].filter(Boolean),
    [selectedArea, selectedVibe, selectedBudget],
  );

  const clearFilter = (key) => {
    if (key === "area") setSelectedArea("");
    if (key === "vibe") setSelectedVibe("");
    if (key === "budget") setSelectedBudget("");
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
  };

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

  // Natural-language search → calls the serverless function → fills the filters
  const runAiSearch = async () => {
    const q = text.trim();
    if (!q) return;

    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, areas, types: vibes, budgets }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();

      // If the barista answered a question (who are you / what do you do / off-topic),
      // show that reply and don't touch the filters.
      if (data.reply && !data.area && !data.type && !data.budget) {
        setBaristaReply(data.reply);
        setText("");
        setQuery("");
        return;
      }
      setBaristaReply("");

      // Only accept values that actually exist in our filter lists
      const inList = (val, list) =>
        (val &&
          list.find((x) => x.toLowerCase() === String(val).toLowerCase())) ||
        "";

      // Apply parsed filters; clear free-text so it doesn't double-filter
      setSelectedArea(inList(data.area, areas));
      setSelectedVibe(inList(data.type, vibes));
      setSelectedBudget(inList(data.budget, budgets));
      setLastSearch(q); // remember what they asked, to show it
      setText("");
      setQuery("");
    } catch {
      setAiError(
        "AI search is unavailable right now — try the filters or a keyword.",
      );
    } finally {
      setAiLoading(false);
    }
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
    <main className="min-h-screen px-4 py-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden rounded-[2rem] border border-edge bg-gradient-to-br from-blush via-cream to-sage px-6 py-10 shadow-lift md:px-10 md:py-12">
          {/* Warm light blobs — now that the colour tokens exist, these actually render */}
          <div className="pointer-events-none absolute -left-20 -top-16 h-56 w-56 rounded-full bg-honey/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-0 h-52 w-52 rounded-full bg-terracotta/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-4rem] left-1/3 h-56 w-56 rounded-full bg-sage/60 blur-3xl" />

          <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-center">
            {/* LEFT — copy */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-honey-deep/30 bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cocoa shadow-soft">
                ☕ Jaipur · {stats.count} cafés
              </span>

              <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] text-deep md:text-6xl">
                Find where Jaipur
                <br className="hidden md:block" />{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">actually drinks</span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 rounded-sm bg-honey/50"
                  />
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted md:mx-0">
                Ranked by real ratings and{" "}
                <strong className="font-bold text-deep">
                  {stats.reviews.toLocaleString()}
                </strong>{" "}
                reviews — not ads. Ask in plain English, or filter by hand.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <button
                  onClick={handleSurprise}
                  className="btn-primary rounded-full px-6 py-2.5 text-sm font-bold"
                >
                  🎲 Surprise me
                </button>
                <span className="text-xs font-semibold text-subtle">
                  {stats.areas} areas · up to {stats.top}★
                </span>
              </div>
            </div>

            {/* RIGHT — mascot */}
            <div className="flex flex-1 justify-center md:justify-end">
              <div className="animate-float-soft">
                <PixelMascot size="lg" subtitle="your pixel café guide" />
              </div>
            </div>
          </div>
        </section>

        {/* ── SEARCH ── */}
        <section className="mx-auto max-w-4xl">
          <div className="panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="search">
              Search cafés
            </label>
            <div className="relative flex-1">
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
                placeholder="Try: somewhere fancy in C Scheme"
                className="w-full rounded-xl border border-edge bg-white py-3 pl-10 pr-3 text-[15px] text-deep placeholder:text-subtle focus-visible:border-honey-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={runAiSearch}
                disabled={aiLoading || !text.trim()}
                className="btn-primary flex-1 rounded-xl px-5 py-3 text-sm font-bold sm:flex-none"
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
          </div>
        </section>

        {/* ── FILTER BAR ── */}
        <section className="mx-auto max-w-4xl">
          <div className="panel flex flex-wrap items-center justify-center gap-3 rounded-2xl px-4 py-3">
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
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-deep">
              {filteredCafes.length}{" "}
              {filteredCafes.length === 1 ? "café" : "cafés"}
            </h2>
            {lastSearch ? (
              <p className="mt-1 text-sm text-muted">
                for “<span className="font-semibold text-deep">{lastSearch}</span>
                ”
              </p>
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

          <PixelMascot
            subtitle={mascotState.subtitle}
            mood={mascotState.mood}
            size="sm"
          />
        </section>

        {/* ── CAFÉ GRID ── */}
        <section>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        inline-flex cursor-pointer items-center gap-2
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
      <span className="font-bold">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          cursor-pointer border-none bg-transparent
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
