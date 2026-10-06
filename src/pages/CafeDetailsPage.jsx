import { useParams, useNavigate } from "react-router-dom";
import cafes from "../data/cafes.json";
import Tag from "../components/Tag";
import HighlightTag from "../components/HighlightTag";
import PixelMascot from "../components/PixelMascot";
import { getHue } from "../lib/cuisineHues";

export default function CafeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const cafe = cafes.find((c) => c.id === id);

  if (!cafe) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl bg-surface border border-edge shadow-soft p-6 text-center">
          <p className="text-muted mb-3">Cafe not found.</p>
          <button
            onClick={() => navigate("/")}
            className="btn-primary px-4 py-2 rounded-full text-sm font-semibold"
          >
            Go back home
          </button>
        </div>
      </main>
    );
  }

  const menuHighlights = cafe.menu_highlights || cafe["menu-highlights"] || [];
  const mapQuery = encodeURIComponent(`${cafe.name} ${cafe.area} Jaipur`);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-muted hover:text-deep transition"
        >
          ← Back to results
        </button>

        {/* Hero */}
        {(() => {
          const hue = getHue(cafe.vibe_tags);
          const initial =
            (cafe.name || "").trim().charAt(0).toUpperCase() || "☕";
          return (
            <section
              style={{ background: hue.bg, borderTopColor: hue.accent }}
              className="rounded-3xl border border-edge border-t-4 shadow-lift px-6 py-7 md:px-8 md:py-8"
            >
              <div className="flex items-start gap-4 md:gap-5">
                {/* Monogram */}
                <div
                  style={{
                    background: hue.monoBg,
                    color: hue.monoText,
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                  }}
                  className="flex items-center justify-center text-2xl font-semibold flex-shrink-0"
                >
                  {initial}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div
                    className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-black/5 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: hue.monoText }}
                  >
                    <span>Jaipur Cafe</span>
                    {cafe.authenticity && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-current opacity-30" />
                        <span>{cafe.authenticity}</span>
                      </>
                    )}
                  </div>

                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-deep leading-tight">
                    {cafe.name}
                  </h1>

                  <p className="text-sm md:text-base font-semibold text-deep/70">
                    {cafe.area} • {cafe.price_band}
                  </p>

                  {cafe.rating && (
                    <div className="flex items-center gap-1.5 text-sm text-deep">
                      <span aria-hidden="true" style={{ color: "var(--accent-star)" }}>★</span>
                      <span className="font-semibold">{cafe.rating}</span>
                      {cafe.review_count ? (
                        <span className="text-deep/60">
                          · {cafe.review_count.toLocaleString()} reviews on
                          Zomato
                        </span>
                      ) : null}
                    </div>
                  )}

                  {Array.isArray(cafe.vibe_tags) &&
                    cafe.vibe_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cafe.vibe_tags.map((v) => (
                          <span
                            key={v}
                            style={{
                              background: hue.tagBg,
                              color: hue.tagText,
                            }}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Primary actions — cafe.url is the Zomato listing */}
                  <div className="flex flex-wrap items-center gap-2 pt-3">
                    {cafe.url && (
                      <a
                        href={cafe.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
                      >
                        View on Zomato →
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      📍 Directions
                    </a>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* About */}
        <section>
          <h2 className="font-display text-2xl font-bold text-deep mb-2">
            About this cafe
          </h2>
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
            <p className="text-muted leading-relaxed text-base">
              {cafe.description}
            </p>
          </div>
        </section>

        {/* Details */}
        <section>
          <h2 className="font-display text-2xl font-bold text-deep mb-3">
            Details
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {cafe.hours && (
              <InfoBox icon="⏰" label="Hours" value={cafe.hours} />
            )}
            {Array.isArray(cafe.seating) && cafe.seating.length > 0 && (
              <InfoBox
                icon="🪑"
                label="Seating"
                value={cafe.seating.join(" · ")}
              />
            )}
            {cafe.veg_nonveg && (
              <InfoBox icon="🥗" label="Menu Type" value={cafe.veg_nonveg} />
            )}
            {cafe.price_band && (
              <InfoBox icon="💸" label="Budget" value={cafe.price_band} />
            )}
          </div>
        </section>

        {/* Menu Highlights */}
        {Array.isArray(menuHighlights) && menuHighlights.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold text-deep mb-2">
              Menu Highlights
            </h2>
            <div className="flex flex-wrap gap-2">
              {menuHighlights.map((item) => (
                <HighlightTag key={item}>{item}</HighlightTag>
              ))}
            </div>
          </section>
        )}

        {/* Location */}
        <section>
          <h2 className="font-display text-2xl font-bold text-deep mb-3">
            Location
          </h2>
          <div className="rounded-2xl border border-edge bg-surface shadow-soft p-4 flex flex-col gap-3">
            <div className="h-52 rounded-xl overflow-hidden border border-edge bg-cream">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-muted">
                {cafe.name} · {cafe.area}, Jaipur
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-bold"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </section>

        <CafeMascotNote cafe={cafe} />
      </div>
    </main>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-edge bg-surface shadow-soft p-3 flex flex-col gap-1 transition-all duration-200 hover:border-edge-strong hover:shadow-lift hover:-translate-y-0.5">
      <div className="text-lg">{icon}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-subtle">
        {label}
      </div>
      <div className="text-sm font-bold text-deep">{value}</div>
    </div>
  );
}

function CafeMascotNote({ cafe }) {
  const hue = getHue(cafe.vibe_tags);

  if (cafe.mascot_note) {
    return (
      <div className="mt-10 flex justify-end">
        <PixelMascot
          subtitle={cafe.mascot_note}
          mood="playful"
          glowColor={hue.monoBg}
        />
      </div>
    );
  }
  const tags = (Array.isArray(cafe.vibe_tags) ? cafe.vibe_tags : []).map((v) =>
    v.toLowerCase(),
  );
  const rating = cafe.rating || 0;
  const has = (t) => tags.some((x) => x.includes(t));

  let line = "A solid pick if you're exploring the area.";
  let mood = "default";

  // Cuisine-driven personality (matches the real data)
  if (has("italian")) {
    line = "Pasta, pizza and good coffee — come hungry.";
    mood = "playful";
  } else if (has("continental")) {
    line = "Continental plates and a relaxed sit-down vibe.";
    mood = "chill";
  } else if (has("fast food") || has("street food")) {
    line = "Quick bites and easy cravings — casual and fuss-free.";
    mood = "cosy";
  } else if (has("desserts") || has("bakery")) {
    line = "Save room for something sweet here.";
    mood = "playful";
  } else if (has("beverages") || has("cafe")) {
    line = "Coffee-first kind of place — great for a slow catch-up.";
    mood = "chill";
  } else if (has("chinese") || has("thai") || has("asian")) {
    line = "Asian flavours done right — bring friends and share.";
    mood = "playful";
  } else if (has("north indian") || has("south indian")) {
    line = "Hearty desi comfort food — proper full-meal energy.";
    mood = "cosy";
  } else if (has("bar")) {
    line = "Drinks and a livelier evening crowd.";
    mood = "night";
  }

  // Rating-driven add-on (varies it further, café to café)
  if (rating >= 4.7) {
    line += " And the crowd clearly adores it.";
  } else if (rating >= 4.3) {
    line += " A well-loved local favourite.";
  }

  return (
    <div className="mt-10 flex justify-end">
      <PixelMascot subtitle={line} mood={mood} glowColor={hue.monoBg} />
    </div>
  );
}
