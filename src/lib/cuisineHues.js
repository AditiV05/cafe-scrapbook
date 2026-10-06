// ── Cuisine colour families ──
// Shared by CafeCard and CafeDetailsPage so a café keeps the same identity
// colour across the grid and its detail page.
//
// Five saturated families, each cuisine mapped to one. Previously the same
// pastel object was copy-pasted per cuisine in two separate files, which is
// how the two views drifted apart.

export const HUE_FAMILIES = {
  amber: {
    bg: "#FAECD2",
    monoBg: "#E8B860",
    monoText: "#4A3410",
    tagBg: "#F2DCAF",
    tagText: "#5C4318",
    accent: "#D9901A",
  },
  violet: {
    bg: "#EDEBF8",
    monoBg: "#B9B2E0",
    monoText: "#322C5C",
    tagBg: "#DDD9F0",
    tagText: "#3D3866",
    accent: "#6D62B8",
  },
  terracotta: {
    bg: "#FAE4D9",
    monoBg: "#E4A387",
    monoText: "#5C2D18",
    tagBg: "#F2CDBB",
    tagText: "#6B3825",
    accent: "#C4633C",
  },
  rose: {
    bg: "#FAE2E9",
    monoBg: "#E3A0B4",
    monoText: "#5C2436",
    tagBg: "#F2C9D5",
    tagText: "#6B2E42",
    accent: "#C05372",
  },
  green: {
    bg: "#DEEFE6",
    monoBg: "#8FC9AF",
    monoText: "#14382C",
    tagBg: "#C6E4D3",
    tagText: "#1F4A3E",
    accent: "#3F8A68",
  },
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
