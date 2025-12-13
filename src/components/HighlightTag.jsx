export default function HighlightTag({ children }) {
  return (
    <span
      className="
        inline-flex items-center gap-1
        px-3 py-1
        rounded-full
        text-sm font-medium text-[--color-deep]
        bg-white/75 backdrop-blur-md border border-white/60
        shadow-soft hover:shadow-lift hover:-translate-y-0.5
        transition-all duration-200
      "
    >
      {children}
    </span>
  );
}
