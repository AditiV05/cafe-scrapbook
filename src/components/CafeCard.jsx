import { Link } from "react-router-dom";
import Tag from "./Tag";
import { getHue } from "../lib/cuisineHues";

function PriceBadge({ price }) {
  return (
    <span className="shrink-0 rounded-md border border-edge bg-cream px-2 py-0.5 text-[11px] font-semibold text-cocoa">
      {price}
    </span>
  );
}

function RatingBadge({ rating, reviews }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-baseline gap-1.5 text-[13px] text-deep">
      <span aria-hidden="true" style={{ color: "var(--accent-star)" }}>
        ★
      </span>
      <span className="font-bold tabular-nums">{rating}</span>
      {reviews ? (
        <span className="text-[11px] text-subtle">
          {reviews.toLocaleString()} reviews
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
      className="group block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-deep focus-visible:ring-offset-2"
    >
      <article
        id={cafe.id}
        style={{ borderTopColor: hue.accent }}
        className={`
          flex h-full flex-col overflow-hidden
          rounded-card border border-edge border-t-[3px]
          bg-surface shadow-soft
          transition-all duration-200
          group-hover:-translate-y-1 group-hover:border-edge-strong group-hover:shadow-lift
          animate-fade-in-up
          ${isHighlighted ? "highlight-ring" : ""}
        `}
      >
        {/* ── Colour band header ── */}
        <div
          style={{ background: hue.bg }}
          className="flex items-start gap-3 px-4 pb-3 pt-4"
        >
          {/* Monogram pill */}
          <div
            style={{ background: hue.monoBg, color: hue.monoText }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-display text-xl font-bold"
          >
            {initial}
          </div>

          {/* Name + area + tags */}
          <div className="min-w-0 flex-1">
            <h3 className="mb-0.5 font-display text-[15px] font-bold leading-snug text-deep">
              {cafe.name}
            </h3>
            <p
              className="mb-1.5 text-[11px] font-semibold"
              style={{ color: hue.monoText }}
            >
              {cafe.area}
            </p>

            {headerTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {headerTags.map((tag) => (
                  <span
                    key={tag}
                    style={{ background: hue.tagBg, color: hue.tagText }}
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Card body ── */}
        <div className="flex flex-1 flex-col gap-2 border-t border-edge px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <RatingBadge rating={cafe.rating} reviews={cafe.review_count} />
            <PriceBadge price={cafe.price_band} />
          </div>

          {cafe.description && (
            <p className="m-0 line-clamp-2 text-xs leading-relaxed text-muted">
              {cafe.description}
            </p>
          )}

          {/* Remaining vibe tags (beyond the 3 shown in header) */}
          {Array.isArray(cafe.vibe_tags) && cafe.vibe_tags.length > 3 && (
            <div className="mt-auto flex flex-wrap gap-1 pt-1">
              {cafe.vibe_tags.slice(3, 6).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {(cafe.hours ||
          (Array.isArray(cafe.seating) && cafe.seating.length > 0)) && (
          <div className="flex items-center justify-between gap-2 border-t border-edge px-4 py-2">
            {cafe.hours && (
              <span className="text-[11px] text-subtle">⏰ {cafe.hours}</span>
            )}
            {Array.isArray(cafe.seating) && cafe.seating.length > 0 && (
              <span className="text-[11px] text-subtle">
                🪑 {cafe.seating.join(" · ")}
              </span>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}
