import { useEffect, useMemo, useRef, useState } from "react";

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
 * A chip row that says when there is more of it off-screen.
 *
 * Under 768px the rows scroll sideways, and they were simply cut at the edge
 * — at 360 that hid "Vaishali Nagar", "Durgapura" and "Gopalpura" behind a
 * clean vertical crop that looks like the end of the list. The fades are the
 * only thing telling you to swipe.
 */
function ChipRail({ children }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () =>
      setEdge({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    read();
    el.addEventListener("scroll", read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", read);
      ro.disconnect();
    };
  }, [children]);

  return (
    <div
      className={`chip-rail ${edge.left ? "chip-rail--l" : ""} ${
        edge.right ? "chip-rail--r" : ""
      }`}
    >
      <div ref={ref} className="chip-row flex gap-1.5 overflow-x-auto pb-0.5">
        {children}
      </div>
    </div>
  );
}

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
        /* items-start, not items-center: when a group wraps to two rows the
           centred label floated between them instead of beside the first. */
        <div key={g.key} className="flex items-start gap-2">
          <span className="w-11 shrink-0 pt-[0.5rem] text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-faint">
            {g.label}
          </span>
          <ChipRail>
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
          </ChipRail>
        </div>
      ))}
    </div>
  );
}
