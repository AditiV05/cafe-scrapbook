import { Routes, Route } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import cafes from "../data/cafes.json";
import CafeCard from "../components/CafeCard";
import PixelMascot from "../components/PixelMascot";
import SpotlightCard from "../components/SpotlightCard";

export default function App() {
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("");
  const [query, setQuery] = useState(""); // debounced value
  const [text, setText] = useState(""); // live input
  const [highlightedId, setHightlightedId] = useState("");
  const [focusedCafe, setFocusedCafe] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setQuery(text), 200);
    return () => clearTimeout(id);
  }, [text]);

  const budgets = useMemo(
    () =>
      [...new Set(cafes.map((c) => c.price_band))].sort((a, b) =>
        a.localeCompare(b)
      ),
    []
  );

  const areas = useMemo(
    () =>
      [...new Set(cafes.map((c) => c.area))].sort((a, b) => a.localeCompare(b)),
    []
  );

  const vibes = useMemo(
    () =>
      [...new Set(cafes.flatMap((c) => c.vibe_tags || []))].sort((a, b) =>
        a.localeCompare(b)
      ),
    []
  );

  const filteredCafes = useMemo(() => {
    const q = query.trim().toLowerCase();

    return cafes.filter((cafe) => {
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
            (t) => t.toLowerCase() === selectedVibe.toLowerCase()
          )
        : true;

      return matchesSearch && matchBudget && matchArea && matchVibe;
    });
  }, [query, selectedBudget, selectedArea, selectedVibe]);

  const mascotState = useMemo(() => {
    const trimmed = text.trim();
    const hasFilters = !!(selectedBudget || selectedArea || selectedVibe);
    const count = filteredCafes.length;

    let subtitle =
      "Filter by vibe, budget or area and I'll help you pick a spto.";
    let mood = "default";

    // No search, no filters → gentle nudge
    if (!trimmed && !hasFilters) {
      subtitle =
        "Start with a vibe, area, or a keyword like “chai” or “rooftop”.";
      mood = "default";
      return { subtitle, mood };
    }

    // Filters only
    if (!trimmed && hasFilters) {
      if (count === 0) {
        subtitle =
          "Your Filters are a bit too picky - try relaxing one or two.";
        mood = "night";
      } else {
        subtitle =
          count === 1
            ? "One cosy option with these filters. Quality over quantity."
            : `Showing ${count} cafes that match your filters. Nice picks`;
        mood = "chill";
      }
      return { subtitle, mood };
    }

    if (trimmed) {
      if (count === 0) {
        subtitle = `Nothing matches "${trimmed}" yet - try a different vibe or area.`;
        mood = "night";
      } else {
        subtitle =
          count === 1
            ? `I found cafe for "${trimmed}".`
            : `I found ${count} cafes for "${trimmed}".`;
        mood = "chill";
      }
    }

    // Vibe-specific override when there are results and no search text
    if (selectedVibe && count > 0 && !trimmed) {
      subtitle = `Chasing a "${selectedVibe}" vibe today? I approve.`;
      mood = "playful";
    }

    return { subtitle, mood };
  }, [text, selectedBudget, selectedArea, selectedVibe, filteredCafes.length]);

  const handleSurprise = () => {
    const pool = filteredCafes.length ? filteredCafes : cafes;
    if (!pool.length) return;

    const randomCafe = pool[Math.floor(Math.random() * pool.length)];

    setHightlightedId(randomCafe.id);

    //Scroll that card into view
    const el = document.getElementById(randomCafe.id);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    setFocusedCafe(randomCafe);

    //remove highlight after a short moment
    setTimeout(() => {
      setHightlightedId("");
    }, 1500);
  };

  return (
    <main className="min-h-screen px-4 py-10">
      {/* One central column for everything */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        {/* HERO SECTION — Pastel × Pixel Hybrid */}
        <section className="relative px-6 pt-10 pb-8 overflow-visible">
          {/* Soft pastel gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[--bg-cream] via-[--bg-blush] to-[--bg-sage] opacity-40 pointer-events-none" />

          {/*floating pastel blobs*/}
          <div className="pointer-events-none absolute -left-16 -top-10 h-40 w-40 rounded-full bg-[--bg-blush] opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute right-[-12px] top-6 h-36 w-36 rounded-full bg-[--bg-sage] opacity-70 blur-3xl" />

          {/* Center container */}
          <div
            className="
            relative max-w-5xl mx-auto 
            flex flex-col md:flex-row items-center gap-6 
            rounded-3xl border border-white/40 bg-white/45 backdrop-blur-lg 
            shadow-[0_16px_50px_rgba(0,0,0,0.12)] 
            px-8 py-10
            animate-float-soft
            "
          >
            {/* LEFT — Text block */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-4xl md:text-5xl text-[--color-deep] drop-shadow-sm">
                Cafe Finder
              </h1>
              <p className="mt-3 text-[--color-deep] opacity-70 text-sm md:text-base leading-relaxed">
                Pinterest-worthy cafés in Jaipur — discover by vibe, budget, and
                mood.
              </p>

              <button
                onClick={handleSurprise}
                className="mt-6 px-6 py-2.5 rounded-full text-sm font-semibold
                   bg-[--accent-yellow] text-[--color-deep]
                   shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
              >
                🎲 Surprise me
              </button>
            </div>

            {/* RIGHT — Pixel mascot */}
            <div className="flex-1 flex justify-center md:justify-end">
              <PixelMascot />
            </div>
          </div>
        </section>

        {/* Search */}
        <section>
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <label className="sr-only" htmlFor="search">
              Search cafés
            </label>
            <input
              id="search"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search by name, vibe, or description..."
              className="flex-1 px-4 py-3 rounded-xl border border-[--border-muted] bg-white/70 backdrop-blur-md shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[--border-muted]"
            />
            <button
              onClick={() => {
                setText("");
                setQuery("");
                setSelectedBudget("");
                setSelectedArea("");
                setSelectedVibe("");
              }}
              className="px-4 py-3 rounded-xl border border-[--border-muted] bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition text-[--color-deep] opacity-80"
              aria-label="Clear filters"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Filter Bar */}
        <section>
          <div
            className="
      max-w-4xl mx-auto
      rounded-2xl border border-white/60
      bg-white/55 backdrop-blur-xl
      shadow-soft px-4 py-3
      flex flex-wrap items-center justify-center gap-3
    "
          >
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
              label="Vibe"
              icon="✨"
              id="vibe"
              value={selectedVibe}
              onChange={setSelectedVibe}
              options={vibes}
              placeholder="All Vibes"
            />
          </div>
        </section>

        {/* Results count (nice touch) */}
        <section className="max-w-6xl mx-auto">
          <p className="text-sm text-[--color-deep] opacity-70">
            Showing {filteredCafes.length} cafés
          </p>
        </section>

        {/* Mascot reacting to search + filters */}
        <section className="max-w-6xl mx-auto flex justify-end">
          <PixelMascot
            subtitle={mascotState.subtitle}
            mood={mascotState.mood}
            size="sm"
          />
        </section>

        {/* Cafe Grid */}
        <section>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCafes.length > 0 ? (
              filteredCafes.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  isHighlighted={highlightedId === cafe.id}
                />
              ))
            ) : (
              <div className="col-span-full rounded-card border border-white/40 bg-white/50 backdrop-blur-md shadow-soft p-6 text-center text-[--color-deep] opacity-70">
                No cafés match your filters. Try clearing or adjusting the
                vibe/budget.
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
  return (
    <label
      htmlFor={id}
      className="
        inline-flex items-center gap-2
        rounded-full border border-white/80
        bg-white/80
        px-3 py-1.5
        shadow-soft backdrop-blur-xl
        text-xs text-[--color-deep]
        cursor-pointer
        transition-all duration-200
        hover:shadow-lift hover:-translate-y-0.5
      "
    >
      <span className="text-sm">{icon}</span>
      <span className="font-medium">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          bg-transparent
          border-none
          text-[11px] font-normal text-[--color-deep]
          focus:outline-none focus:ring-0
          cursor-pointer
        "
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
