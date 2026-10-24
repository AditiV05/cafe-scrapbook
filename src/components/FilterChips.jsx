import { useMemo } from "react";

const hasTag = (cafe, tag) =>
  (cafe.vibe_tags || []).some(
    (t) => t.toLowerCase() === String(tag).toLowerCase(),
  );

const MATCH = {
  area: (c, v) => c.area === v,
  type: hasTag,
  budget: (c, v) => c.price_band === v,
};

/**
 * One-tap filters that carry their own counts.
 *
 * The dropdowns these replace hard-ANDed three fields over 45 cafés, where
 * 91% of area+type+budget combinations match nothing. Each option counts
 * itself against the filters already active, so an option that would empty
 * the page is never offered — the dead end is impossible rather than handled.
 */
export default function FilterChips({ cafes, selected, onChange }) {
  const groups = useMemo(() => {
    const countWith = (group, value) =>
      cafes.filter((c) =>
        Object.entries({ ...selected, [group]: value }).every(
          ([g, v]) => !v || MATCH[g](c, v),
        ),
      ).length;

    const options = (group, values) =>
      values
        .map((value) => ({ value, count: countWith(group, value) }))
        .filter((o) => o.count > 0 || selected[group] === o.value)
        .sort((a, b) => b.count - a.count);

    const areas = [...new Set(cafes.map((c) => c.area))];
    const types = [...new Set(cafes.flatMap((c) => c.vibe_tags || []))];
    const budgets = [...new Set(cafes.map((c) => c.price_band))].sort();

    return [
      { key: "area", label: "Area", options: options("area", areas).slice(0, 5) },
      { key: "type", label: "Type", options: options("type", types).slice(0, 6) },
      { key: "budget", label: "Budget", options: options("budget", budgets) },
    ];
  }, [cafes, selected]);

  return (
    <div className="flex flex-col gap-2">
      {groups.map((g) => (
        <div key={g.key} className="flex items-center gap-2">
          <span className="w-11 shrink-0 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
            {g.label}
          </span>
          <div className="chip-row flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => onChange(g.key, "")}
              aria-pressed={!selected[g.key]}
              className={`chip ${!selected[g.key] ? "chip--on" : ""}`}
            >
              all
            </button>
            {g.options.map((o) => {
              const active = selected[g.key] === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => onChange(g.key, active ? "" : o.value)}
                  aria-pressed={active}
                  className={`chip ${active ? "chip--on" : ""}`}
                >
                  {o.value}
                  <span className="chip__n">{o.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
