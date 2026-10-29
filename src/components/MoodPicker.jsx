import { MOODS } from "../lib/editorial";

const TAPES = ["tape--kraft tape--left", "tape--washi-a tape--mid", "tape--kraft tape--tone-c tape--right"];
const TINTS = ["", "note--tintA", "note--tintB", "", "note--tintC", "note--tintA"];
const TILTS = ["tilt-1", "tilt-2", "tilt-3", "tilt-4"];

/**
 * The way in for most visits: pick an occasion, not three filters.
 *
 * A row of taped cards that scrolls sideways on a phone and wraps into a
 * grid from tablet up. Each card carries a barista sticker and up to three
 * polaroids of its picks, so the first screen shows the cafés instead of
 * only describing them. Picking one hands its id to the page, which swaps
 * the board for that spread; picking it again goes back to everything.
 */
export default function MoodPicker({ active, onPick }) {
  return (
    <section aria-labelledby="moods-title" className="mb-6">
      <h2 id="moods-title" className="handwritten mb-3 text-[22px] font-bold text-[#5E5141]">
        what are you in the mood for?
      </h2>
      <div className="mood-row">
        {MOODS.map((m, i) => {
          const on = m.id === active;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(on ? "" : m.id)}
              aria-pressed={on}
              className={`note mood ${TINTS[i % TINTS.length]} ${
                on ? "mood--on tilt-0" : TILTS[i % TILTS.length]
              }`}
            >
              <span aria-hidden="true" className={`tape ${TAPES[i % TAPES.length]}`} />
              <span className="flex items-center gap-2">
                <img src={m.sticker} alt="" aria-hidden="true" className="mood__sticker" />
                <span className="font-display text-[17px] font-bold leading-tight text-deep">
                  {m.title}
                </span>
              </span>
              <span className="handwritten mt-1 block text-[15.5px] leading-snug text-[#3A3024]">
                {m.note}
              </span>
              <span className="mt-auto flex items-end justify-between gap-2 pt-2.5">
                {m.snaps.length > 0 && (
                  <span aria-hidden="true" className="mood__snaps">
                    {m.snaps.map((s) => (
                      <span key={s.id} className="mood__snap">
                        <img src={s.src} alt="" loading="lazy" />
                      </span>
                    ))}
                  </span>
                )}
                <span className="ml-auto shrink-0 text-[11px] font-bold text-faint">
                  {on ? "showing these ↓" : `${m.cafes.length} picks →`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
