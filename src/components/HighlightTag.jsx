export default function HighlightTag({ children }) {
  return (
    <span
      className="
        inline-flex items-center gap-1
        rounded-full border border-edge bg-surface
        px-3 py-1 text-sm font-semibold text-deep
        shadow-soft transition-all duration-200
        hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-lift
      "
    >
      {children}
    </span>
  );
}
