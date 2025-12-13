import { useParams, useNavigate } from "react-router-dom";
import cafes from "../data/cafes.json";
import PixelMascot from "../components/PixelMascot";
import Tag from "../components/Tag";
import HighlightTag from "../components/HighlightTag";

export default function CafeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const cafe = cafes.find((c) => c.id === id);

  if (!cafe) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-[--color-deep] opacity-70">
          Café not found.
          <button onClick={() => navigate("/")} className="underline ml-2">
            Go home
          </button>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-[--color-deep] opacity-60 hover:opacity-100 transition"
      >
        ← Back to results
      </button>

      {/*HERO SECTION*/}
      <section className="relative rounded-3xl overflow-hiden border border-white/50 bg-white/40 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.12)] px-6 py-6 md:px-8 md:py-8">
        {/*soft gradient background*/}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[--bg-cream] via-[--bg-blush] to-[--bg-sage] opacity-60" />

        {/* floating blobs */}
        <div className="pointer-events-none absolute -left-10 -top-8 h-32 w-32 rounded-fulll bg-[--bg-blush] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute right-[-16px] bottom-0 h-40 w-40 rounded-full bg-[--bg-sage] opacity-60 blur-3xl" />

        {/*actual content */}
        <div className="rlative flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          {/* LEFT: text */}
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 border border-white/70 text-[11px] uppercase tracking-wide text-[--color-deep] opacity-80">
              <span>Jaipur Cafe</span>
              {cafe.authenticity && (
                <>
                  <span className="h-1 w-1 rounded-full bg-[--color-deep]/30" />
                  <span>{cafe.authenticity}</span>
                </>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-[--color-deep] drop-shadow-sm">
              {cafe.name}
            </h1>

            <p className="text-sm md:text-base text-[--color-deep] opacity-75">
              {cafe.area} • {cafe.price_band}
            </p>

            {Array.isArray(cafe.vibe_tags) && cafe.vibe_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {cafe.vibe_tags.map((v) => (
                  <Tag key={v}>{v}</Tag>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: image / placeholder */}
          <div className="flex-1 w-full md:max-w-sm">
            <div className="rounded-2xl overflow-hidden border border-white/70 bg-white/50 backdrop-blur-md shadow-soft">
              {cafe.images?.length ? (
                <img
                  src={cafe.images[0]}
                  alt={cafe.name}
                  className="w-full h-52 md:h-64 object-cover"
                />
              ) : (
                <div className="w-full h-52 md:h-64 flex items-center justify-center bg-gradient-to-br from-[--color-blush] to-[--color-sage] text-[--color-deep]/60 text-sm italic">
                  No images yet- imagine fairy lights & coffee
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="font-display text-xl text-[--color-deep] mb-2">
          About this cafe
        </h2>
        <p className="text-[--color-deep] opacity-80 leading-relaxed text-base">
          {cafe.description}
        </p>
      </section>

      {/* Info Grid */}
      <section>
        <h2 className="font-display text-xl text-[--color-deep] mb-3">
          Details
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {cafe.hours && <InfoBox icon="⏰" label="Hours" value={cafe.hours} />}
          {cafe.seating?.length && (
            <InfoBox
              icon="🪑"
              label="Seating"
              value={cafe.seating.join(" · ")}
            />
          )}
          {cafe.veg_nonveg && (
            <InfoBox icon="🥗" label="Menu Type" value={cafe.veg_nonveg} />
          )}
          {cafe.price_band && (
            <InfoBox icon="💸" label="Budget" value={cafe.price_band} />
          )}
        </div>
      </section>

      {/* Menu Highlights */}
      {cafe["menu-highlights"] && (
        <section>
          <h2 className="font-display text-xl text-[--color-deep] mb-2">
            Menu Highlights
          </h2>

          <div className="flex flex-wrap gap-2">
            {cafe["menu-highlights"].map((item) => (
              <HighlightTag key={item}>{item}</HighlightTag>
            ))}
          </div>
        </section>
      )}

      {/* Location */}
      <section>
        <h2 className="font-display text-xl text-[--color-deep] mb-3">
          Location
        </h2>

        <div className="rounded-2xl border border-white/60 bg-white/60 backfrop-blur-md shadow-soft p-4 flex flex-col gap-3">
          {/* Fake map preview box for now */}
          <div className="h-40 rounded bg-gradient-to-br from-[--color-blush] to-[--color-sage] flex items-center justify-center text-[--color-deep]/60 text-xs italic">
            Map preview coming soon - Opening in Google Maps for now
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-[--color-deep] opacity-80">
              {cafe.name} · {cafe.area}, Jaipur
            </p>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${cafe.name} ${cafe.area} Jaipur`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center justify-center
                px-3 py-1.5 rounded-full text-xs font-semibold
                bg-[--accent-yellow] text-[--color-deep]
                shadow-soft hover:shadow-lift hover:-translate-y-0.5
                transition-all
              "
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      </section>

      {/* Mascot note */}
      <CafeMascotNote cafe={cafe} />
    </main>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div
      className="
        rounded-xl border border-white/70 bg-white/70 
        backdrop-blur-md shadow-soft p-3
        flex flex-col gap-1
        transition-all duration-200
        hover:shadow-lift hover:-translate-y-0.5
      "
    >
      <div className="text-lg">{icon}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-60">
        {label}
      </div>
      <div className="text-sm font-semibold text-[--color-deep]">{value}</div>
    </div>
  );
}

function CafeMascotNote({ cafe }) {
  const price = cafe.price_band || "";
  const vibesRaw = Array.isArray(cafe.vibe_tags) ? cafe.vibe_tags : [];
  const vibes = vibesRaw.map((v) => v.toLowerCase());
  const seatingArr = Array.isArray(cafe.seating) ? cafe.seating : [];

  const hasRooftop = seatingArr.some((s) =>
    s.toLowerCase().includes("rooftop")
  );
  const hasOutdoor = seatingArr.some((s) =>
    s.toLowerCase().includes("outdoor")
  );

  let line = "I'll help you pick your next cosy corner here.";
  let mood = "default";

  // Budget-based tone
  if (price === "₹") {
    line = "Budget-friendly and cosy - perfect for everyday chai runs.";
    mood = "cosy";
  } else if (price === "₹₹₹") {
    line = "A little fancy, a lot of vibes. Maybe dress cute for this one.";
    mood = "playful";
  } else if (price === "₹₹") {
    line = "Nice balance of comfort and treat-yourself enerygy.";
    mood = "chill";
  }

  // Vibes-bases overrides
  if (vibes.some((v) => v.includes("work"))) {
    line = "Laptop-friendly and calm - ideal for deep-focus days.";
    mood = "chill";
  } else if (vibes.some((v) => v.includes("date"))) {
    line = "Soft lights, pretty corners... this one screams date night.";
    mood = "playful";
  } else if (vibes.includes("heritage")) {
    line = "Old-world charm and chai - feels like time slows down here.";
    mood = "cosy";
  } else if (vibes.includes("boho")) {
    line = "Boho cushions and artsy corners... don't forget to take pictures.";
    mood = "playful";
  } else if (vibes.includes("calm")) {
    line = "Quiet and gentle - perfect for when your brain needs softness.";
    mood = "chill";
  }

  // Seating-based add-on
  if (hasRooftop) {
    line += " Don't miss the rooftop seats.";
  } else if (hasOutdoor) {
    line += " Try grabbing a spot outside if the weather's nice";
  }

  return (
    <div className="mt-10 flex justify-end">
      <PixelMascot subtitle={line} mood={mood} />
    </div>
  );
}
