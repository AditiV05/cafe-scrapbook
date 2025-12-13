import { useEffect } from "react";
import CafeCard from "./CafeCard";

export default function SpotlightCard({ cafe, onClose }) {
  //close on escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!cafe) return null;

  return (
    <div
      className="
    fixed inset-0 z-40 
    flex items-center justify-center
    bg-[rgba(10, 16, 14, 0.45)]"
      onClick={onClose}
    >
      <div
        className="max-w-md w-[90%] sm:w-[80%]
        animate-spotlight-in"
        onClick={(e) => e.stopPropagation()} // prevent close when clicking card
      >
        {/* reuse your existing cafeCard styling*/}
        <CafeCard cafe={cafe} isHighlighted={false} />
      </div>
    </div>
  );
}
