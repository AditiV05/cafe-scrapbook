import { useEffect, useRef, useState } from "react";
import defaultBanner from "../assets/hero-jaipur.svg";

/**
 * Full-bleed banner with a depth treatment layered over the artwork.
 *
 * To use a real photograph instead of the illustrated default, drop the file in
 * src/assets/ and pass it in:
 *
 *   import hero from "../assets/hero.jpg";
 *   <HeroBanner image={hero} />
 *
 * Everything else — the scrim, the parallax, the vignette, the text scale —
 * works the same for a photo.
 */
export default function HeroBanner({
  image = defaultBanner,
  alt = "Jaipur skyline at sunset, seen from a café table",
  focal = "50% 58%",
  children,
}) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  // Gentle parallax: the artwork drifts slower than the page, which reads as
  // distance. Skipped entirely for prefers-reduced-motion.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        // -24px … +24px across the banner's travel through the viewport
        setOffset(Math.max(-24, Math.min(24, -rect.top * 0.12)));
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden rounded-[1.75rem] border border-edge shadow-lift"
    >
      {/* Artwork */}
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 -z-20 h-[calc(100%+48px)] w-full object-cover"
        style={{ objectPosition: focal, transform: `translateY(${offset}px)` }}
        draggable="false"
      />

      {/* Scrim — holds the text column at AA contrast, then clears off the
          artwork. Stops are measured against the rendered banner, not guessed. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(18,9,22,0.94) 0%, rgba(18,9,22,0.90) 30%," +
            " rgba(18,9,22,0.78) 48%, rgba(18,9,22,0.42) 66%," +
            " rgba(18,9,22,0.12) 84%, rgba(18,9,22,0) 100%)",
        }}
      />
      {/* Bottom fade, so the banner settles into the page instead of stopping dead */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#1C0F22]/60 to-transparent"
      />

      <div className="relative px-5 py-10 sm:px-10 sm:py-14 md:py-16 lg:px-14 lg:py-20">
        {children}
      </div>
    </section>
  );
}
