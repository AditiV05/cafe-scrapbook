import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import cafes from "../data/cafes.json";
import ScrapHeader from "../components/ScrapHeader";
import ScrapNote from "../components/ScrapNote";
import Board from "../components/Board";
import FilterChips from "../components/FilterChips";
import PixelMascot from "../components/PixelMascot";
import MoodPicker from "../components/MoodPicker";
import { moodById } from "../lib/editorial";
import { matchQuery, parseQueryLocally, runSearch } from "../lib/search";

const TOTAL = cafes.length;

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Runs `done` once the page has stopped scrolling, and returns a cancel.
 *
 * `scrollend` would be the right event, but Safari only shipped it in 18, so
 * this watches the position settle instead. The frame cap stops it hanging
 * forever if a scroll never lands.
 */
function whenScrollSettles(done) {
  let id = 0;
  let last = window.scrollY;
  let still = 0;
  let frames = 0;
  const tick = () => {
    const y = window.scrollY;
    still = y === last ? still + 1 : 0;
    last = y;
    if (still >= 3 || ++frames > 180) {
      done();
      return;
    }
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

export default function Home() {
  const [selected, setSelected] = useState({ area: "", type: "", budget: "" });
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [lastSearch, setLastSearch] = useState("");
  const [relaxNote, setRelaxNote] = useState("");
  const [baristaReply, setBaristaReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState("");
  const flashTimer = useRef(0);
  const cancelSettle = useRef(null);
  const lastPick = useRef("");
  // The open mood spread lives in the URL, so it can be shared and the back
  // button closes it.
  const [params, setParams] = useSearchParams();
  const mood = moodById(params.get("mood"));
  const pickMood = (id) => setParams(id ? { mood: id } : {});

  useEffect(
    () => () => {
      clearTimeout(flashTimer.current);
      cancelSettle.current?.();
    },
    [],
  );

  // 45 rows filter instantly, so typing filters as you type.
  useEffect(() => {
    const id = setTimeout(() => setQuery(text), 150);
    return () => clearTimeout(id);
  }, [text]);

  const vocab = useMemo(
    () => ({
      areas: [...new Set(cafes.map((c) => c.area))],
      types: [...new Set(cafes.flatMap((c) => c.vibe_tags || []))],
      budgets: [...new Set(cafes.map((c) => c.price_band))].sort(),
    }),
    [],
  );

  const totalReviews = useMemo(
    () => cafes.reduce((s, c) => s + (c.review_count || 0), 0),
    [],
  );

  // Typing and the chips do the same job from different ends: the chips narrow
  // the list, the words rank what is left. If the two together leave nothing,
  // the words win and the chips are reported as ignored — a typed query is a
  // clearer statement of intent than a chip someone forgot they clicked.
  const { results, searchNote } = useMemo(() => {
    const chipped = cafes.filter((c) => {
      if (selected.area && c.area !== selected.area) return false;
      if (selected.budget && c.price_band !== selected.budget) return false;
      if (
        selected.type &&
        !(c.vibe_tags || []).some(
          (t) => t.toLowerCase() === selected.type.toLowerCase(),
        )
      )
        return false;
      return true;
    });

    const q = query.trim() || keywords.join(" ");
    if (!q) {
      return {
        results: [...chipped].sort(
          (a, b) => (a.popularity_rank ?? 999) - (b.popularity_rank ?? 999),
        ),
        searchNote: "",
      };
    }

    const inChips = matchQuery(chipped, q);
    if (inChips.results.length)
      return { results: inChips.results, searchNote: inChips.note };

    const everywhere = matchQuery(cafes, q);
    if (!everywhere.results.length) return { results: [], searchNote: "" };
    return {
      results: everywhere.results,
      searchNote: `Nothing fit that inside your filters, so I looked across all ${TOTAL}.`,
    };
  }, [query, selected, keywords]);

  const reset = () => {
    setSelected({ area: "", type: "", budget: "" });
    setText("");
    setQuery("");
    setKeywords([]);
    setLastSearch("");
    setRelaxNote("");
    setBaristaReply("");
  };

  const filtering = !!(
    selected.area || selected.type || selected.budget || keywords.length || query
  );

  // The model handles phrasing the local read can't; everything else already
  // works without it, so a failure here is not a dead end.
  const askAi = async () => {
    const q = text.trim();
    if (!q) return;
    setAiLoading(true);

    const local = parseQueryLocally(q, vocab);
    let intent = local;

    try {
      const res = await fetch("/api/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, ...vocab }),
      });
      if (!res.ok) throw new Error("unavailable");
      const data = await res.json();
      if (data.reply && !data.area && !data.type && !data.budget) {
        setBaristaReply(data.reply);
        setText("");
        setQuery("");
        setAiLoading(false);
        return;
      }
      const inList = (v, list) =>
        (v && list.find((x) => x.toLowerCase() === String(v).toLowerCase())) || "";
      intent = {
        area: inList(data.area, vocab.areas) || local.area,
        type: inList(data.type, vocab.types) || local.type,
        budget: inList(data.budget, vocab.budgets) || local.budget,
        keywords: local.keywords,
      };
    } catch {
      /* the local read already answered */
    }

    setBaristaReply("");
    const { applied, droppedLabels } = runSearch(cafes, intent);
    setSelected({ area: applied.area, type: applied.type, budget: applied.budget });
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

  const surprise = () => {
    // Rolling with an empty board would pick a café that isn't rendered, so
    // the scroll and the flash both go nowhere. Let the whole list back in.
    const empty = results.length === 0;
    const pool = empty ? cafes : results;
    const choices =
      pool.length > 1 ? pool.filter((c) => c.id !== lastPick.current) : pool;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    lastPick.current = pick.id;
    if (empty) reset();

    // A second roll must not inherit the first one's timers: the old code let
    // the previous 1.6s timeout wipe the new highlight mid-animation.
    clearTimeout(flashTimer.current);
    cancelSettle.current?.();
    setHighlightedId("");

    requestAnimationFrame(() => {
      const el = document.getElementById(pick.id);
      if (!el) return;
      el.scrollIntoView({
        behavior: reducedMotion() ? "auto" : "smooth",
        block: "center",
      });
      // Light the card on arrival, not on departure. A roll to the bottom of
      // the board takes ~1.4s to land and the flash only ran for 1.5s, so
      // half the time you got there to find nothing marked.
      cancelSettle.current = whenScrollSettles(() => {
        setHighlightedId(pick.id);
        flashTimer.current = setTimeout(() => setHighlightedId(""), 2300);
      });
    });
  };

  return (
    <main className="paper paper--full min-h-screen px-[clamp(1.25rem,3vw,1.9rem)] pb-11 pt-[clamp(1.25rem,3vw,1.9rem)]">
      <div className="mx-auto max-w-[1120px] min-[1600px]:max-w-[1500px]">
        <div className="pl-[clamp(1.4rem,2.6vw,2.5rem)]">
          <ScrapHeader count={TOTAL} reviews={totalReviews} />

          <MoodPicker active={mood?.id} onPick={pickMood} />

          {mood ? (
            <>
              <section className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-[clamp(1.3rem,3vw,1.7rem)] font-bold text-deep">
                  <span aria-hidden="true">{mood.emoji} </span>
                  {mood.title}
                </h2>
                <button
                  onClick={() => pickMood("")}
                  className="text-xs font-bold text-cocoa underline underline-offset-2 hover:text-deep"
                >
                  ← back to all {TOTAL}
                </button>
              </section>
              <Board
                items={mood.cafes}
                renderItem={(c, i) => <ScrapNote key={c.id} cafe={c} index={i} />}
              />
            </>
          ) : (
            <>
              {/* Tools */}
              <section className="mb-6 flex flex-col gap-3">
                {/* Below 480 the input, Ask and Surprise me shared one row and the
                    input got ~190px of it — the placeholder was cut mid-word. The
                    input takes its own line there and the buttons split the next. */}
                <div className="flex flex-wrap items-end gap-2">
                  <label className="sr-only" htmlFor="search">
                    Look for a café
                  </label>
                  <input
                    id="search"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && text.trim()) askAi();
                    }}
                    placeholder="try breakfast, pasta, somewhere to work…"
                    className="handwritten min-w-0 basis-full border-0 border-b-2 border-dashed border-edge-strong bg-transparent px-1 py-2 text-[19px] text-deep placeholder:text-[#A8977F] focus:outline-none focus-visible:border-honey-deep min-[480px]:basis-0 min-[480px]:flex-1 min-[1280px]:max-w-[44rem]"
                  />
                  <button
                    onClick={askAi}
                    disabled={aiLoading || !text.trim()}
                    className="btn-primary flex-1 rounded-full px-4 py-2.5 text-xs font-bold min-[480px]:flex-none"
                  >
                    {aiLoading ? "…" : "✨ Ask"}
                  </button>
                  <button
                    onClick={surprise}
                    title="Pick a café at random"
                    className="btn-ghost flex-1 rounded-full px-3 py-2.5 text-xs font-bold min-[480px]:flex-none"
                  >
                    <span aria-hidden="true" className="text-sm">🎲</span>
                    <span className="ml-1.5">Surprise me</span>
                  </button>
                </div>

                <FilterChips
                  cafes={cafes}
                  selected={selected}
                  onChange={(group, value) =>
                    setSelected((s) => ({ ...s, [group]: value }))
                  }
                />
              </section>

              {/* What's on the page */}
              <section className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="handwritten text-[18px] text-[#5E5141]">
                  {results.length === TOTAL
                    ? `all ${TOTAL} pinned up`
                    : `${results.length} of ${TOTAL} pinned up`}
                  {lastSearch && <> for “{lastSearch}”</>}
                </p>
                {filtering && (
                  <button
                    onClick={reset}
                    className="text-xs font-bold text-cocoa underline underline-offset-2 hover:text-deep"
                  >
                    clear
                  </button>
                )}
                {(relaxNote || searchNote) && (
                  <p className="basis-full text-xs font-semibold text-cocoa">
                    {relaxNote || searchNote}
                  </p>
                )}
              </section>

              {baristaReply && (
                <div className="mb-5 flex justify-center">
                  <PixelMascot subtitle={baristaReply} mood="playful" wide />
                </div>
              )}

              {/* The board */}
              {results.length > 0 ? (
                <Board
                  items={results}
                  renderItem={(c, i) => (
                    <ScrapNote
                      key={c.id}
                      cafe={c}
                      index={i}
                      isHighlighted={highlightedId === c.id}
                    />
                  )}
                />
              ) : (
                <div className="note tilt-0 mx-auto max-w-sm text-center">
                  <span aria-hidden="true" className="tape tape--washi-c tape--mid" />
                  <p className="handwritten text-[22px] text-[#3A3024]">
                    nothing matches that…
                  </p>
                  <button
                    onClick={reset}
                    className="btn-primary mt-3 rounded-full px-4 py-2 text-xs font-bold"
                  >
                    show all {TOTAL}
                  </button>
                </div>
              )}
            </>
          )}

          <footer className="mt-10 text-center text-[11px] text-faint">
            Ranked by rating weighted against review count. A snapshot of a
            public Zomato Jaipur dataset — not live data.
          </footer>
        </div>
      </div>
    </main>
  );
}
