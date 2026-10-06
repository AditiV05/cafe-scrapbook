// ── Cuisine colour families ──
// Shared by CafeCard and CafeDetailsPage so a café keeps the same identity
// colour across the grid and its detail page.
//
// The cards are paper, not colour blocks, so each family is only three values:
//
//   spine  saturated enough to read as a 3px bar and as small-caps text
//   tint   a pale wash, used behind the monogram letter only
//   ink    dark, readable on `tint` and used for the letter itself
//
// Large tinted fields were the problem before: five pastel panels in one grid
// read as fruit salad. Colour now identifies a café without colouring it in.

export const HUE_FAMILIES = {
  amber: { spine: "#B07B25", tint: "#F6E7C8", ink: "#4A3410" },
  violet: { spine: "#5F54A8", tint: "#E2DEF4", ink: "#322C5C" },
  terracotta: { spine: "#B2593A", tint: "#F6DBCD", ink: "#5C2D18" },
  rose: { spine: "#B04668", tint: "#F7D9E2", ink: "#5C2436" },
  green: { spine: "#3F8A68", tint: "#D3EADD", ink: "#14382C" },
};

export const CUISINE_FAMILY = {
  "Fast Food": "amber",
  "Street Food": "amber",
  Bakery: "amber",
  "North Indian": "amber",
  Continental: "violet",
  Bar: "violet",
  Italian: "terracotta",
  Pizza: "terracotta",
  Mexican: "terracotta",
  Asian: "rose",
  Thai: "rose",
  Chinese: "rose",
  Desserts: "rose",
  Beverages: "green",
  Cafe: "green",
  "South Indian": "green",
  "Highly Rated": "green",
  "Pure Veg": "green",
};

const DEFAULT_HUE = HUE_FAMILIES.amber;

// Case-insensitive so it tolerates data drift in vibe_tags.
const LOOKUP = new Map(
  Object.entries(CUISINE_FAMILY).map(([name, family]) => [
    name.toLowerCase(),
    family,
  ]),
);

export function getHue(vibeTags) {
  const tags = Array.isArray(vibeTags) ? vibeTags : [];
  for (const tag of tags) {
    const family = LOOKUP.get(String(tag).toLowerCase());
    if (family) return HUE_FAMILIES[family];
  }
  return DEFAULT_HUE;
}
