import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import cafes from "../data/cafes.json";
import CafeCard from "../components/CafeCard";
import PixelMascot from "../components/PixelMascot";
import { getHue } from "../lib/cuisineHues";

const TOTAL = cafes.length;

/** Cafés worth offering next: same area first, then same lead cuisine. */
function useRelated(cafe) {
  return useMemo(() => {
    if (!cafe) return [];
    const others = cafes.filter((c) => c.id !== cafe.id);
    const lead = (cafe.vibe_tags || [])[0];
    const byRank = (a, b) =>
      (a.popularity_rank ?? 999) - (b.popularity_rank ?? 999);

    const sameArea = others.filter((c) => c.area === cafe.area).sort(byRank);
    const sameCuisine = others
      .filter(
        (c) => lead && (c.vibe_tags || []).includes(lead) && c.area !== cafe.area,
      )
      .sort(byRank);

    const picked = [...sameArea, ...sameCuisine].slice(0, 3);
    return picked.length ? picked : others.sort(byRank).slice(0, 3);
  }, [cafe]);
}

function Stat({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-0.5 px-1">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd className="font-display text-xl font-bold leading-none text-deep">
        {children}
      </dd>
      {hint && <p className="text-[11px] font-semibold text-faint">{hint}</p>}
    </div>
  );
}

export default function CafeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cafe = cafes.find((c) => c.id === id);
  const related = useRelated(cafe);

  if (!cafe) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center">
        <div className="rounded-2xl border border-edge bg-surface p-6 text-center shadow-soft">
          <p className="mb-3 text-muted">Cafe not found.</p>
          <button
            onClick={() => navigate("/")}
            className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
          >
            Go back home
          </button>
        </div>
      </main>
    );
  }

  const hue = getHue(cafe.vibe_tags);
  const initial = (cafe.name || "").trim().charAt(0).toUpperCase() || "☕";
  const mapQuery = encodeURIComponent(`${cafe.name} ${cafe.area} Jaipur`);
  const rank = cafe.popularity_rank;
  const relatedLabel =
    related.length && related[0].area === cafe.area
      ? `More in ${cafe.area}`
      : "You might also like";

  return (
    <main className="page-shell min-h-screen">
      <div className="mx-auto max-w-5xl space-y-[clamp(1.5rem,3.4vw,2rem)]">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-muted transition hover:text-deep"
        >
          ← Back to results
        </button>

        {/* ── HERO ── */}
        <section
          style={{ "--spine": hue.spine }}
          className="paper-card rounded-3xl px-[clamp(1.1rem,3.6vw,2rem)] py-[clamp(1.3rem,3.4vw,2rem)] shadow-lift"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div
                style={{ background: hue.tint, color: hue.ink }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-bold"
              >
                {initial}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <p
                  className="text-[11px] font-extrabold uppercase tracking-[0.17em]"
                  style={{ color: hue.ink }}
                >
                  Jaipur café{cafe.authenticity ? ` · ${cafe.authenticity}` : ""}
                </p>

                <h1 className="font-display text-[clamp(1.6rem,5.4vw,3rem)] font-bold leading-[1.1] text-deep [text-wrap:balance]">
                  {cafe.name}
                </h1>

                <p className="text-sm font-semibold text-faint md:text-base">
                  {cafe.area} · {cafe.price_band}
                  {cafe.veg_nonveg ? ` · ${cafe.veg_nonveg}` : ""}
                </p>

                {Array.isArray(cafe.vibe_tags) && cafe.vibe_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cafe.vibe_tags.map((v) => (
                      <span
                        key={v}
                        className="rounded-full border border-edge px-2.5 py-[3px] text-[10.5px] font-bold tracking-wide text-cocoa"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-3 sm:flex sm:flex-wrap sm:items-center">
                  {cafe.url && (
                    <a
                      href={cafe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
                    >
                      View on Zomato →
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    📍 Directions
                  </a>
                </div>
              </div>
            </div>

            {/* Rank medallion — the strongest fact on the page, and it was
                never shown. Also gives the hero's empty right side a job. */}
            {rank && (
              <div
                style={{ background: hue.tint, color: hue.ink }}
                className="flex items-center gap-4 justify-self-start rounded-2xl px-5 py-4 md:w-44 md:flex-col md:gap-1 md:justify-self-end md:py-6 md:text-center"
              >
                <span className="font-display text-4xl font-bold leading-none md:text-5xl">
                  #{rank}
                </span>
                <span className="text-[11px] font-extrabold uppercase leading-snug tracking-[0.12em]">
                  most loved
                  <span className="block font-bold opacity-75">
                    of {TOTAL} cafés
                  </span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── THE BARISTA'S NOTE ──
            Hand-written per café, and the only non-generated prose in the
            dataset. It used to sit at the very bottom of the page. */}
        {cafe.mascot_note && (
          <section className="flex justify-center md:justify-start">
            <PixelMascot
              subtitle={cafe.mascot_note}
              mood="playful"
              size="lg"
              glowColor={hue.tint}
              wide
            />
          </section>
        )}

        {/* ── STATS ──
            Replaces the old "Details" boxes. Hours, seating and menu
            highlights are empty in all 45 rows, so those boxes could only
            ever render two sparse tiles. */}
        <section>
          <h2 className="mb-3 font-display text-[clamp(1.25rem,2.6vw,1.5rem)] font-bold text-deep">
            At a glance
          </h2>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-edge bg-edge shadow-soft sm:grid-cols-4">
            <div className="bg-surface p-4">
              <Stat label="Rating" hint="out of 5">
                {cafe.rating ?? "—"}
              </Stat>
            </div>
            <div className="bg-surface p-4">
              <Stat label="Reviews" hint="on Zomato">
                {cafe.review_count ? cafe.review_count.toLocaleString() : "—"}
              </Stat>
            </div>
            <div className="bg-surface p-4">
              <Stat label="Budget" hint="per head">
                {cafe.price_band}
              </Stat>
            </div>
            <div className="bg-surface p-4">
              <Stat label="Menu" hint="veg / non-veg">
                {cafe.veg_nonveg || "—"}
              </Stat>
            </div>
          </dl>
        </section>

        {/* ── LOCATION ── */}
        <section>
          <h2 className="mb-3 font-display text-[clamp(1.25rem,2.6vw,1.5rem)] font-bold text-deep">
            Location
          </h2>
          <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4 shadow-soft">
            <div className="aspect-[16/9] max-h-72 overflow-hidden rounded-xl border border-edge bg-cream">
              <iframe
                title={`Map showing ${cafe.name}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                {cafe.name} · {cafe.area}, Jaipur
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-bold"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </section>

        {/* ── RELATED ──
            The page used to end here with nothing to do next. */}
        {related.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[clamp(1.25rem,2.6vw,1.5rem)] font-bold text-deep">
                {relatedLabel}
              </h2>
              <Link
                to="/"
                className="shrink-0 text-sm font-semibold text-muted transition hover:text-deep"
              >
                See all {TOTAL} →
              </Link>
            </div>
            <div className="card-grid">
              {related.map((c) => (
                <CafeCard key={c.id} cafe={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
