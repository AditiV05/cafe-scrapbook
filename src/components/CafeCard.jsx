import { Link } from "react-router-dom";
import Tag from "./Tag";

// Maps a café's primary vibe tag → a pastel hue set
// Each entry: { bg, monoBg, monoText, tagBg, tagText }
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

function PriceBadge({ price }) {
  return (
    <span
      style={{
        fontSize: "11px",
        padding: "2px 8px",
        borderRadius: "6px",
        background: "white",
        border: "0.5px solid rgba(0,0,0,0.12)",
        color: "#444",
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {price}
    </span>
  );
}

function RatingBadge({ rating, reviews }) {
  if (!rating) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        color: "var(--color-deep, #2C2C2A)",
      }}
    >
      <span style={{ color: "#BA7517" }}>★</span>
      <span style={{ fontWeight: 600 }}>{rating}</span>
      {reviews ? (
        <span style={{ opacity: 0.55 }}>
          · {reviews.toLocaleString()} reviews
        </span>
      ) : null}
    </span>
  );
}

export default function CafeCard({ cafe, isHighlighted }) {
  const hue = getHue(cafe.vibe_tags);
  const initial = (cafe.name || "").trim().charAt(0).toUpperCase() || "☕";
  const headerTags = (cafe.vibe_tags || []).slice(0, 3);

  return (
    <Link
      to={`/cafe/${cafe.id}`}
      className="block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border-muted] focus-visible:ring-offset-2"
    >
      <article
        id={cafe.id}
        className={`
          flex flex-col h-full
          rounded-card overflow-hidden
          bg-white/70 backdrop-blur-md
          border border-white/40 shadow-soft
          hover:shadow-lift hover:-translate-y-1
          transition-all duration-200
          animate-fade-in-up
          ${isHighlighted ? "highlight-ring" : ""}
        `}
      >
        {/* ── Color band header ── */}
        <div
          style={{ background: hue.bg }}
          className="px-4 pt-4 pb-3 flex items-start gap-3"
        >
          {/* Monogram pill */}
          <div
            style={{
              background: hue.monoBg,
              color: hue.monoText,
              width: 44,
              height: 44,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>

          {/* Name + area + tags */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-display text-[--color-deep] opacity-90 leading-tight mb-0.5"
              style={{ fontSize: 14, fontWeight: 600 }}
            >
              {cafe.name}
            </h3>
            <p
              style={{
                fontSize: 11,
                opacity: 0.55,
                color: hue.monoText,
                margin: "0 0 6px",
              }}
            >
              {cafe.area}
            </p>

            {headerTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {headerTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 5,
                      background: hue.tagBg,
                      color: hue.tagText,
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-white/40" />

        {/* ── Card body ── */}
        <div className="px-4 py-3 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <RatingBadge rating={cafe.rating} reviews={cafe.review_count} />
            <PriceBadge price={cafe.price_band} />
          </div>

          {cafe.description && (
            <p
              className="text-[--color-deep] line-clamp-2"
              style={{
                fontSize: 12,
                opacity: 0.75,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {cafe.description}
            </p>
          )}

          {/* Remaining vibe tags (beyond the 3 shown in header) */}
          {Array.isArray(cafe.vibe_tags) && cafe.vibe_tags.length > 3 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {cafe.vibe_tags.slice(3, 6).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {(cafe.hours ||
          (Array.isArray(cafe.seating) && cafe.seating.length > 0)) && (
          <>
            <div className="border-t border-white/40" />
            <div className="px-4 py-2 flex items-center justify-between gap-2">
              {cafe.hours && (
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.55,
                    color: "var(--color-deep)",
                  }}
                >
                  ⏰ {cafe.hours}
                </span>
              )}
              {Array.isArray(cafe.seating) && cafe.seating.length > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.55,
                    color: "var(--color-deep)",
                  }}
                >
                  🪑 {cafe.seating.join(" · ")}
                </span>
              )}
            </div>
          </>
        )}
      </article>
    </Link>
  );
}
