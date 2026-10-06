import barista from "../assets/barista.png";

// Mood → glow colour behind the card. Real colours, not near-white washes.
const MOOD_GLOW = {
  default: "rgba(240, 173, 51, 0.38)",
  cosy: "rgba(210, 105, 74, 0.32)",
  chill: "rgba(91, 140, 123, 0.34)",
  playful: "rgba(192, 83, 114, 0.30)",
  night: "rgba(61, 56, 102, 0.34)",
};

const SIZE_MAP = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export default function PixelMascot({
  subtitle = "your pixel café guide",
  mood = "default",
  size = "md",
  glowColor = null, // optional: a CSS color that overrides the mood glow
  wide = false, // the café detail page shows the note as a pull-quote
}) {
  const glow = glowColor || MOOD_GLOW[mood] || MOOD_GLOW.default;
  const avatarSize = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`
        relative flex w-full items-center gap-3
        rounded-2xl border border-edge bg-surface
        px-4 py-3 shadow-soft
        ${wide ? "max-w-2xl gap-4 px-5 py-4" : "max-w-sm"}
      `}
    >
      {/* Soft glow halo behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-md"
        style={{ backgroundColor: glow }}
      />

      <img
        src={barista}
        alt="Pixel barista mascot"
        width="64"
        height="64"
        className={`pixelated animate-bounce-slow shrink-0 object-contain ${avatarSize}`}
        draggable="false"
      />

      <span className={`font-semibold leading-snug text-deep ${wide ? "text-[15px]" : "text-[13px]"}`}>
        {subtitle}
      </span>
    </div>
  );
}
