// What the ₹ / ₹₹ / ₹₹₹ bands mean in rupees. The bands bucket Zomato's
// cost for two in price_band() in scripts/build_cafes.py; keep the two in step.
// The bands stay the stored value (search and the ✨ Ask parser match on
// them); these labels are only what people read.
export const BUDGET_ORDER = ["₹", "₹₹", "₹₹₹"];

const LABELS = { "₹": "Under ₹400", "₹₹": "₹400–800", "₹₹₹": "₹800+" };

export const budgetLabel = (band) => LABELS[band] || band;
