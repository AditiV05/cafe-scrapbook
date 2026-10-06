import { useEffect } from "react";
import CafeCard from "./CafeCard";

export default function SpotlightCard({ cafe, onClose }) {
  // Close on escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock background scroll while the spotlight is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!cafe) return null;

  return (
    // NOTE: the backdrop colour is set inline. Tailwind arbitrary values cannot
    // contain spaces — `bg-[rgba(10, 16, 14, 0.45)]` silently generated nothing,
    // which left the overlay fully transparent.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Spotlight on ${cafe.name}`}
      style={{ backgroundColor: "rgba(22, 16, 8, 0.55)" }}
      className="animate-backdrop-in fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-spotlight-in w-full max-w-sm"
        onClick={(e) => e.stopPropagation()} // prevent close when clicking card
      >
        <div className="mb-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-honey px-3.5 py-1.5 text-xs font-bold text-[#33240B] shadow-glow">
            🎲 Your random pick
          </span>
        </div>

        {/* Reuse the existing CafeCard styling */}
        <CafeCard cafe={cafe} isHighlighted={false} />

        <button
          onClick={onClose}
          className="mx-auto mt-3 block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-white/25"
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
}
