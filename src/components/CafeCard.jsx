import Tag from "./Tag";

function PriceBadge({ price }) {
  return (
    <span className="text-xs px-2 py-1 rounded-md bg-white/80 border border-[--border-muted] shadow-sm text-[--color-deep] opacity-80">
      {price}
    </span>
  );
}

export default function CafeCard({ cafe, isHighlighted }) {
  const hasImage = Array.isArray(cafe.images) && cafe.images.length > 0;

  return (
    <article
      id={cafe.id}
      className={`
    rounded-card bg-white/70 backdrop-blur-md 
    border border-white/40 shadow-soft 
    overflow-hidden 
    hover:shadow-lift hover:-translate-y-1
    transition-all duration-200 
    flex flex-col h-full
    animate-fade-in-up
    ${isHighlighted ? "highlight-ring" : ""}
    `}
    >
      {/* Image / Placeholder with fixed aspect */}
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-[--color-blush] to-[--color-sage] flex items-center justify-center">
        {hasImage ? (
          <img
            src={cafe.images[0]}
            alt={cafe.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-sm text-[--color-deep] opacity-50 italic">
            No image yet
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-display text-[--color-deep] opacity-90">
            {cafe.name}
          </h3>
          <PriceBadge price={cafe.price_band} />
        </div>

        <p className="text-xs text-[--color-deep] opacity-60">{cafe.area}</p>

        <p className="text-sm text-[--color-deep] opacity-80 line-clamp-2">
          {cafe.description}
        </p>

        {/* Vibe tags */}
        {Array.isArray(cafe.vibe_tags) && cafe.vibe_tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {cafe.vibe_tags.slice(0, 4).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}

        {/* Meta row (hours + seating) */}
        {(cafe.hours || (cafe.seating && cafe.seating.length)) && (
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-[--color-deep] opacity-70">
            {cafe.hours && (
              <div className="rounded-md bg-white/70 border border-[--border-muted] px-2 py-1">
                ⏰ {cafe.hours}
              </div>
            )}
            {Array.isArray(cafe.seating) && cafe.seating.length > 0 && (
              <div className="rounded-md bg-white/70 border border-[--border-muted] px-2 py-1">
                🪑 {cafe.seating.join(" · ")}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
