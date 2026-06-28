import { useParams, useNavigate } from "react-router-dom";
import cafes from "../data/cafes.json";
import Tag from "../components/Tag";
import HighlightTag from "../components/HighlightTag";
import PixelMascot from "../components/PixelMascot";

const VIBE_HUES = {
  "Fast Food": {
    bg: "#FBF3E4",
    monoBg: "#EBD3A8",
    monoText: "#5C4318",
    tagBg: "#F2E2C4",
    tagText: "#5C4318",
  },
  "Street Food": {
    bg: "#FBF3E4",
    monoBg: "#EBD3A8",
    monoText: "#5C4318",
    tagBg: "#F2E2C4",
    tagText: "#5C4318",
  },
  Continental: {
    bg: "#F1F0FA",
    monoBg: "#D5D2EC",
    monoText: "#3D3866",
    tagBg: "#E3E1F4",
    tagText: "#3D3866",
  },
  Italian: {
    bg: "#FAF0EB",
    monoBg: "#EBCABB",
    monoText: "#6B3825",
    tagBg: "#F2DACE",
    tagText: "#6B3825",
  },
  Asian: {
    bg: "#FBEFF3",
    monoBg: "#EBC6D2",
    monoText: "#6B2E42",
    tagBg: "#F2D7DF",
    tagText: "#6B2E42",
  },
  Thai: {
    bg: "#FBEFF3",
    monoBg: "#EBC6D2",
    monoText: "#6B2E42",
    tagBg: "#F2D7DF",
    tagText: "#6B2E42",
  },
  Beverages: {
    bg: "#EAF5F0",
    monoBg: "#BEE0D2",
    monoText: "#1F4A3E",
    tagBg: "#D4EBE1",
    tagText: "#1F4A3E",
  },
  Cafe: {
    bg: "#EAF5F0",
    monoBg: "#BEE0D2",
    monoText: "#1F4A3E",
    tagBg: "#D4EBE1",
    tagText: "#1F4A3E",
  },
  Bar: {
    bg: "#F1F0FA",
    monoBg: "#D5D2EC",
    monoText: "#3D3866",
    tagBg: "#E3E1F4",
    tagText: "#3D3866",
  },
  Desserts: {
    bg: "#FBEFF3",
    monoBg: "#EBC6D2",
    monoText: "#6B2E42",
    tagBg: "#F2D7DF",
    tagText: "#6B2E42",
  },
  Pizza: {
    bg: "#FAF0EB",
    monoBg: "#EBCABB",
    monoText: "#6B3825",
    tagBg: "#F2DACE",
    tagText: "#6B3825",
  },
  Bakery: {
    bg: "#FBF3E4",
    monoBg: "#EBD3A8",
    monoText: "#5C4318",
    tagBg: "#F2E2C4",
    tagText: "#5C4318",
  },
  "North Indian": {
    bg: "#FBF3E4",
    monoBg: "#EBD3A8",
    monoText: "#5C4318",
    tagBg: "#F2E2C4",
    tagText: "#5C4318",
  },
  "South Indian": {
    bg: "#EAF5F0",
    monoBg: "#BEE0D2",
    monoText: "#1F4A3E",
    tagBg: "#D4EBE1",
    tagText: "#1F4A3E",
  },
  Chinese: {
    bg: "#FBEFF3",
    monoBg: "#EBC6D2",
    monoText: "#6B2E42",
    tagBg: "#F2D7DF",
    tagText: "#6B2E42",
  },
  Mexican: {
    bg: "#FAF0EB",
    monoBg: "#EBCABB",
    monoText: "#6B3825",
    tagBg: "#F2DACE",
    tagText: "#6B3825",
  },
  "Highly Rated": {
    bg: "#EAF5F0",
    monoBg: "#BEE0D2",
    monoText: "#1F4A3E",
    tagBg: "#D4EBE1",
    tagText: "#1F4A3E",
  },
  "Pure Veg": {
    bg: "#EAF5F0",
    monoBg: "#BEE0D2",
    monoText: "#1F4A3E",
    tagBg: "#D4EBE1",
    tagText: "#1F4A3E",
  },
};

const DEFAULT_HUE = {
  bg: "#F4F2EC",
  monoBg: "#DEDBD0",
  monoText: "#4A483F",
  tagBg: "#E8E5DC",
  tagText: "#4A483F",
};

function getHue(vibeTags = []) {
  for (const tag of vibeTags) {
    const match = Object.keys(VIBE_HUES).find(
      (k) => k.toLowerCase() === tag.toLowerCase(),
    );
    if (match) return VIBE_HUES[match];
  }
  return DEFAULT_HUE;
}

export default function CafeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const cafe = cafes.find((c) => c.id === id);

  if (!cafe) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl bg-white/70 border border-white/60 shadow-soft p-6 text-center">
          <p className="text-[--color-deep] opacity-80 mb-3">Cafe not found.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-full bg-[--accent-yellow] text-[--color-deep] text-sm font-semibold shadow-soft hover:shadow-lift transition-all"
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
          className="text-sm text-[--color-deep] opacity-70 hover:opacity-100 transition"
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
              style={{ background: hue.bg }}
              className="rounded-3xl border border-white/50 shadow-[0_18px_50px_rgba(0,0,0,0.08)] px-6 py-7 md:px-8 md:py-8"
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
                    className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 border border-white/70 text-[11px] uppercase tracking-wide"
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

                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-[--color-deep] leading-tight">
                    {cafe.name}
                  </h1>

                  <p className="text-sm md:text-base text-[--color-deep] opacity-75">
                    {cafe.area} • {cafe.price_band}
                  </p>

                  {cafe.rating && (
                    <div className="flex items-center gap-1.5 text-sm text-[--color-deep]">
                      <span style={{ color: "#BA7517" }}>★</span>
                      <span className="font-semibold">{cafe.rating}</span>
                      {cafe.review_count ? (
                        <span className="opacity-60">
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
                </div>
              </div>
            </section>
          );
        })()}

        {/* About */}
        <section>
          <h2 className="font-display text-xl text-[--color-deep] mb-2">
            About this cafe
          </h2>
          <p className="text-[--color-deep] opacity-80 leading-relaxed text-base">
            {cafe.description}
          </p>
        </section>

        {/* Details */}
        <section>
          <h2 className="font-display text-xl text-[--color-deep] mb-3">
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
            <h2 className="font-display text-xl text-[--color-deep] mb-2">
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
          <h2 className="font-display text-xl text-[--color-deep] mb-3">
            Location
          </h2>
          <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md shadow-soft p-4 flex flex-col gap-3">
            <div className="h-52 rounded-xl overflow-hidden border border-white/70 bg-white/70">
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
              <p className="text-sm text-[--color-deep] opacity-80">
                {cafe.name} · {cafe.area}, Jaipur
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[--accent-yellow] text-[--color-deep] shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all"
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
    <div className="rounded-xl border border-white/70 bg-white/70 backdrop-blur-md shadow-soft p-3 flex flex-col gap-1 transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5">
      <div className="text-lg">{icon}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-60">
        {label}
      </div>
      <div className="text-sm font-semibold text-[--color-deep]">{value}</div>
    </div>
  );
}

function CafeMascotNote({ cafe }) {
  const price = cafe.price_band || "";
  const vibes = (Array.isArray(cafe.vibe_tags) ? cafe.vibe_tags : []).map((v) =>
    v.toLowerCase(),
  );
  const seatingArr = Array.isArray(cafe.seating) ? cafe.seating : [];
  const hasRooftop = seatingArr.some((s) =>
    s.toLowerCase().includes("rooftop"),
  );
  const hasOutdoor = seatingArr.some((s) =>
    s.toLowerCase().includes("outdoor"),
  );

  let line = "I'll help you understand this cafe better.";
  let mood = "default";

  if (price === "₹") {
    line = "Budget-friendly and cosy — a good everyday chai run.";
    mood = "cosy";
  } else if (price === "₹₹") {
    line = "Nice balance of comfort and treat-yourself energy.";
    mood = "chill";
  } else if (price === "₹₹₹") {
    line = "A little fancy, a lot of vibes — maybe dress cute for this one.";
    mood = "playful";
  }

  if (vibes.some((v) => v.includes("work"))) {
    line = "Laptop-friendly and calm — ideal for deep-focus days.";
    mood = "chill";
  } else if (vibes.some((v) => v.includes("date"))) {
    line = "Soft lights and pretty corners — this one screams date night.";
    mood = "playful";
  } else if (vibes.some((v) => v.includes("heritage"))) {
    line = "Old-world charm and chai — feels like time slows down here.";
    mood = "cosy";
  } else if (vibes.some((v) => v.includes("calm"))) {
    line = "Quiet and gentle — perfect for when your brain needs softness.";
    mood = "chill";
  }

  if (hasRooftop) line += " Don't miss the rooftop seats.";
  else if (hasOutdoor) line += " Grab a spot outside if the weather's nice.";

  return (
    <div className="mt-10 flex justify-end">
      <PixelMascot subtitle={line} mood={mood} />
    </div>
  );
}
