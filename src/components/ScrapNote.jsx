import { Link } from "react-router-dom";
import { decorate } from "../lib/scrapbook";

/**
 * One café, pinned to the page.
 *
 * The mascot note is set in the handwriting face because it is the only
 * hand-written text in the dataset; everything else here is metadata.
 */
export default function ScrapNote({ cafe, index, isHighlighted }) {
  const d = decorate(index, cafe.popularity_rank);

  return (
    <Link
      to={`/cafe/${cafe.id}`}
      id={cafe.id}
      className={`note ${d.tint} ${d.tilt} ${isHighlighted ? "note--flash" : ""}`}
    >
      <span aria-hidden="true" className={`tape ${d.tape}`} />
      {d.clip && <span aria-hidden="true" className="clip" />}
      {d.badge && (
        <span
          aria-hidden="true"
          className="badge-pin"
          style={{ background: d.badge.color }}
        >
          {d.badge.text}
        </span>
      )}
      {d.sticker && (
        <img
          src={d.sticker.src}
          alt=""
          aria-hidden="true"
          className={`sticker ${d.sticker.pos}`}
          loading="lazy"
          width="76"
          height="76"
        />
      )}

      <span className="handwritten block text-[19px] font-bold leading-none text-terracotta">
        no.{String(cafe.popularity_rank).padStart(2, "0")}
      </span>

      <span className="mb-0.5 mt-px block font-display text-[20px] font-bold leading-[1.14] text-deep">
        {d.ring ? (
          <span className="scribble-wrap">
            <span className={d.marker}>{cafe.name}</span>
            <span aria-hidden="true" className="scribble" />
          </span>
        ) : (
          <span className={d.marker}>{cafe.name}</span>
        )}
      </span>

      <span className="mb-2 block text-[11px] font-bold text-faint">
        {cafe.area} · {cafe.price_band}
      </span>

      {cafe.mascot_note && (
        <span className="handwritten block text-[18px] leading-[1.32] text-[#3A3024]">
          {cafe.mascot_note}
        </span>
      )}

      <span className="mt-2 flex flex-wrap gap-1">
        {(cafe.vibe_tags || []).slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full border border-dashed border-edge-strong px-2 py-[2px] text-[9.5px] font-bold text-cocoa"
          >
            {t}
          </span>
        ))}
      </span>

      <span className="mt-3 flex items-center gap-2 border-t-[1.5px] border-dashed border-edge-strong pt-2">
        <span aria-hidden="true" className="text-star">★</span>
        <span className="handwritten text-[23px] font-bold leading-none text-deep">
          {cafe.rating}
        </span>
        <span className="text-[11px] font-semibold text-faint">
          {cafe.review_count ? cafe.review_count.toLocaleString() : "—"} reviews
        </span>
      </span>
    </Link>
  );
}
