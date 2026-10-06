import { Link } from "react-router-dom";
import { getHue } from "../lib/cuisineHues";

function RatingLine({ rating, reviews, price }) {
  return (
    <div className="flex items-center gap-2">
      {rating ? (
        <>
          <span aria-hidden="true" className="text-[13px] text-star">
            ★
          </span>
          <span className="text-[13px] font-extrabold tabular-nums text-deep">
            {rating}
          </span>
          {reviews ? (
            <span className="text-xs font-semibold text-faint">
              {reviews.toLocaleString()} reviews
            </span>
          ) : null}
        </>
      ) : null}
      <span className="ml-auto rounded border border-edge px-1.5 py-0.5 text-[11px] font-bold text-cocoa">
        {price}
      </span>
    </div>
  );
}

export default function CafeCard({ cafe, isHighlighted }) {
  const hue = getHue(cafe.vibe_tags);
  const initial = (cafe.name || "").trim().charAt(0).toUpperCase() || "☕";
  const tags = (cafe.vibe_tags || []).slice(0, 3);

  return (
    <Link
      to={`/cafe/${cafe.id}`}
      className="group block h-full rounded-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-deep focus-visible:ring-offset-2"
    >
      <article
        id={cafe.id}
        style={{ "--spine": hue.spine }}
        className={`
          paper-card flex h-full flex-col px-4 pb-4 pt-4
          transition-all duration-200
          group-hover:-translate-y-0.5 group-hover:border-edge-strong group-hover:shadow-lift
          ${isHighlighted ? "highlight-ring" : ""}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Monogram — the only tinted surface left on the card */}
          <div
            style={{ background: hue.tint, color: hue.ink }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] font-display text-[17px] font-bold"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[17px] font-bold leading-tight text-deep">
              {cafe.name}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-faint">
              {cafe.area}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <RatingLine
            rating={cafe.rating}
            reviews={cafe.review_count}
            price={cafe.price_band}
          />
        </div>

        {cafe.description && (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
            {cafe.description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-edge px-2.5 py-[3px] text-[10.5px] font-bold tracking-wide text-cocoa"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
