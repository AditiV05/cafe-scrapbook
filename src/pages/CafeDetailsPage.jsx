import { useParams, useNavigate } from "react-router-dom";
import cafes from "../data/cafes.json";
import Tag from "../components/Tag";
import HighlightTag from "../components/HighlightTag";
import PixelMascot from "../components/PixelMascot";

export default function CafeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const cafe = cafes.find((c) => c.id === id);

  if (!cafe) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl bg-white/70 border border-white/60 shadow-soft p-6 text-center">
          <p className="text-[--color-deep] opacity-80 mb-3">Cafe not found.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-full bg-[--accent-yellow] text-[--color-deep] text-sm font-semibold shadow-soft hover:shadow-lift transition-all"
          >
            Go back home
          </button>
        </div>
      </main>
    );
  }

  const menuHighlights = cafe.menu_highlights || cafe["menu-highlights"] || [];
  const mapQuery = encodeURIComponent(`${cafe.name} ${cafe.area} Jaipur`);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[--color-deep] opacity-70 hover:opacity-100 transition"
        >
          ← Back to results
        </button>

        {/* Hero */}
        <section className="relative rounded-3xl overflow-hidden border border-white/50 bg-white/50 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.12)] px-6 py-6 md:px-8 md:py-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[--bg-cream] via-[--bg-blush] to-[--bg-sage] opacity-60" />
          <div className="pointer-events-none absolute -left-10 -top-8 h-32 w-32 rounded-full bg-[--bg-blush] opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute right-[-16px] bottom-0 h-40 w-40 rounded-full bg-[--bg-sage] opacity-60 blur-3xl" />

          <div className="relative flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
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

              {cafe.rating && (
                <div className="flex items-center gap-1.5 text-sm text-[--color-deep]">
                  <span className="text-amber-500">★</span>
                  <span className="font-semibold">{cafe.rating}</span>
                  {cafe.review_count ? (
                    <span className="opacity-60">
                      · {cafe.review_count.toLocaleString()} reviews on Zomato
                    </span>
                  ) : null}
                </div>
              )}

              {Array.isArray(cafe.vibe_tags) && cafe.vibe_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {cafe.vibe_tags.map((v) => (
                    <Tag key={v}>{v}</Tag>
                  ))}
                </div>
              )}
            </div>

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
                    No image yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="font-display text-xl text-[--color-deep] mb-2">
            About this cafe
          </h2>
          <p className="text-[--color-deep] opacity-80 leading-relaxed text-base">
            {cafe.description}
          </p>
        </section>

        {/* Details */}
        <section>
          <h2 className="font-display text-xl text-[--color-deep] mb-3">
            Details
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {cafe.hours && (
              <InfoBox icon="⏰" label="Hours" value={cafe.hours} />
            )}
            {Array.isArray(cafe.seating) && cafe.seating.length > 0 && (
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
        {Array.isArray(menuHighlights) && menuHighlights.length > 0 && (
          <section>
            <h2 className="font-display text-xl text-[--color-deep] mb-2">
              Menu Highlights
            </h2>
            <div className="flex flex-wrap gap-2">
              {menuHighlights.map((item) => (
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
          <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md shadow-soft p-4 flex flex-col gap-3">
            <div className="h-52 rounded-xl overflow-hidden border border-white/70 bg-white/70">
              <iframe
                title={`Map showing ${cafe.name}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-[--color-deep] opacity-80">
                {cafe.name} · {cafe.area}, Jaipur
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[--accent-yellow] text-[--color-deep] shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </section>

        <CafeMascotNote cafe={cafe} />
      </div>
    </main>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/70 backdrop-blur-md shadow-soft p-3 flex flex-col gap-1 transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5">
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
  const vibes = (Array.isArray(cafe.vibe_tags) ? cafe.vibe_tags : []).map((v) =>
    v.toLowerCase(),
  );
  const seatingArr = Array.isArray(cafe.seating) ? cafe.seating : [];
  const hasRooftop = seatingArr.some((s) =>
    s.toLowerCase().includes("rooftop"),
  );
  const hasOutdoor = seatingArr.some((s) =>
    s.toLowerCase().includes("outdoor"),
  );

  let line = "I'll help you understand this cafe better.";
  let mood = "default";

  if (price === "₹") {
    line = "Budget-friendly and cosy — a good everyday chai run.";
    mood = "cosy";
  } else if (price === "₹₹") {
    line = "Nice balance of comfort and treat-yourself energy.";
    mood = "chill";
  } else if (price === "₹₹₹") {
    line = "A little fancy, a lot of vibes — maybe dress cute for this one.";
    mood = "playful";
  }

  if (vibes.some((v) => v.includes("work"))) {
    line = "Laptop-friendly and calm — ideal for deep-focus days.";
    mood = "chill";
  } else if (vibes.some((v) => v.includes("date"))) {
    line = "Soft lights and pretty corners — this one screams date night.";
    mood = "playful";
  } else if (vibes.some((v) => v.includes("heritage"))) {
    line = "Old-world charm and chai — feels like time slows down here.";
    mood = "cosy";
  } else if (vibes.some((v) => v.includes("calm"))) {
    line = "Quiet and gentle — perfect for when your brain needs softness.";
    mood = "chill";
  }

  if (hasRooftop) line += " Don't miss the rooftop seats.";
  else if (hasOutdoor) line += " Grab a spot outside if the weather's nice.";

  return (
    <div className="mt-10 flex justify-end">
      <PixelMascot subtitle={line} mood={mood} />
    </div>
  );
}
