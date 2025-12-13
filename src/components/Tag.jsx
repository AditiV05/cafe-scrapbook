export default function Tag({ children }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-cream border border-black/5 text-deep/80 shadow-sm mr-2 mb-2">
      {children}
    </span>
  );
}
