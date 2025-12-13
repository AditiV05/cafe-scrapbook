import barista from "../assets/barista.png";

const MOOD_GLOW = {
  default: "bg-amber-100/60",
  cosy: "bg-amber-100/60",
  chill: "bg-[--color-sage]/60",
  playful: "bg-pink-100/60",
  night: "bg-slate-500/60",
};

const SIZE_MAP = {
  sm: "h-8 w-8",
  md: "h-[48px] w-[48px]",
  lg: "h-14 w-14",
};

export default function PixelMascot({
  subtitle = "your pixel café guide",
  mood = "default",
  size = "md",
}) {
  const glowClass = MOOD_GLOW[mood] || MOOD_GLOW.default;
  const avatarSize = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className="
        relative inline-flex items-center gap-3 
        bg-white/70 backdrop-blur-md
        border border-black/10 
        shadow-soft rounded-2xl 
        px-4 py-3
      "
    >
      {/* soft glow halo behind card */}
      <div
        className={`
          pointer-events-none absolute inset-0 
          rounded-2xl
          ${glowClass}
          opacity-60 
          blur-md
          -z-10
        `}
      />

      <img
        src={barista}
        alt="Pixel barista mascot"
        className={`pixelated animate-bounce-slow object-contain ${avatarSize}`}
        draggable="false"
      />

      <span className="text-sm font-medium text-deep/80 leading-tight">
        {subtitle}
      </span>
    </div>
  );
}
