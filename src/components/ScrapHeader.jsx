/**
 * The top of the page. Deliberately short — this is a notebook page, and the
 * point of the page is what's pinned to it.
 */
export default function ScrapHeader({ count, reviews }) {
  return (
    <header className="mb-5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-cocoa">
        Pasted up over {reviews.toLocaleString()} reviews
      </p>
      <h1 className="mt-1.5 font-display text-[clamp(1.9rem,6vw,2.75rem)] font-bold leading-[1.04] text-deep">
        Jaipur,{" "}
        <span className="handwritten text-[1.32em] font-bold text-terracotta">
          a café scrapbook
        </span>
      </h1>
      <p className="handwritten mt-1 text-[clamp(1.05rem,2.6vw,1.3rem)] text-[#5E5141]">
        {count} places worth your afternoon — ranked, annotated, argued over.
      </p>
    </header>
  );
}
