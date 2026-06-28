// Branded fallback shown when a café has no real image.
// Honest by design — it doesn't pretend to be a photo of the café.
export default function CafePlaceholder({ name = "", className = "" }) {
  const initial = name.trim().charAt(0).toUpperCase() || "☕";

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center
        bg-gradient-to-br from-[--bg-cream] via-[--bg-blush] to-[--bg-sage]
        text-[--color-deep] ${className}`}
    >
      <span className="text-3xl opacity-70">☕</span>
      <span className="mt-1 text-2xl font-display opacity-30 leading-none">
        {initial}
      </span>
    </div>
  );
}
