// Branded fallback shown when a café has no real image.
// Honest by design — it doesn't pretend to be a photo of the café.
export default function CafePlaceholder({ name = "", className = "" }) {
  const initial = name.trim().charAt(0).toUpperCase() || "☕";

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center
        bg-gradient-to-br from-blush via-cream to-sage text-deep ${className}`}
    >
      <span className="text-3xl" aria-hidden="true">
        ☕
      </span>
      <span className="mt-1 font-display text-2xl font-bold leading-none text-cocoa/40">
        {initial}
      </span>
    </div>
  );
}
