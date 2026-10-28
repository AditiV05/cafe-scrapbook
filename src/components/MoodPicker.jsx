import { MOODS } from "../lib/editorial";

const TAPES = ["tape--kraft tape--left", "tape--washi-a tape--mid", "tape--kraft tape--tone-c tape--right"];
const TINTS = ["", "note--tintA", "note--tintB", "", "note--tintC", "note--tintA"];
const TILTS = ["tilt-1", "tilt-2", "tilt-3", "tilt-4"];

/**
 * The way in for most visits: pick an occasion, not three filters.
 *
 * A row of taped cards that scrolls sideways on a phone and wraps into a
 * grid from tablet up. Picking one hands its id to the page, which swaps the
 * board for that spread; picking it again goes back to everything.
 */
export default function MoodPicker({ active, onPick }) {
  return (
    <section aria-labelledby="moods-title" className="mb-7">
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
              <span aria-hidden="true" className="block text-[26px] leading-none">
                {m.emoji}
              </span>
              <span className="mt-1.5 block font-display text-[17px] font-bold leading-tight text-deep">
                {m.title}
              </span>
              <span className="handwritten mt-1 block text-[16px] leading-snug text-[#3A3024]">
                {m.note}
              </span>
              <span className="mt-2 block text-[11px] font-bold text-faint">
                {on ? "showing these ↓" : `${m.cafes.length} picks →`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
