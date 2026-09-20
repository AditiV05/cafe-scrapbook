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
}) {
  const glow = glowColor || MOOD_GLOW[mood] || MOOD_GLOW.default;
  const avatarSize = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className="
        relative inline-flex max-w-sm items-center gap-3
        rounded-2xl border border-edge bg-surface
        px-4 py-3 shadow-soft
      "
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

      <span className="text-[13px] font-semibold leading-snug text-deep">
        {subtitle}
      </span>
    </div>
  );
}
