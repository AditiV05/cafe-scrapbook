// The hand-written layer on top of the Zomato data: the mood spreads on the
// home page and the Order this / Go when / Skip if notes on each café. It
// lives in editorial.json so it can be edited without touching code and
// can't be overwritten by scripts/build_cafes.py.
import cafes from "../data/cafes.json";
import editorial from "../data/editorial.json";

const byId = Object.fromEntries(cafes.map((c) => [c.id, c]));

// A pick whose café has gone from the data is dropped rather than crashing.
export const MOODS = editorial.moods.map((m) => ({
  ...m,
  cafes: m.picks.map((id) => byId[id]).filter(Boolean),
}));

export const moodById = (id) => MOODS.find((m) => m.id === id);

const TAKE_FIELDS = [
  ["order", "Order this"],
  ["go_when", "Go when"],
  ["skip_if", "Skip if"],
];

/** The filled-in take fields for a café, as [label, text] pairs. */
export const takesFor = (id) => {
  const t = editorial.takes[id] || {};
  return TAKE_FIELDS.filter(([key]) => t[key]).map(([key, label]) => [label, t[key]]);
};

const isPhoto = (src) => /\.(jpe?g|png|webp|avif)$/i.test(src);

/** The café's own cover photo, or null when it only has the placeholder. */
export const coverPhoto = (cafe) => {
  const src = (cafe.images || []).find(isPhoto);
  return src && src.startsWith("/cafes/") ? src : null;
};
