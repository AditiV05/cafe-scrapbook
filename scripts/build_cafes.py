"""
build_cafes.py — Café Finder data ingestion pipeline.

Turns the raw Zomato Jaipur dataset (~4,700 rows, all eateries) into a
curated cafes.json of the city's most-loved cafés.

Key idea: popularity = rating WEIGHTED BY review volume (Bayesian average),
so a 4.9 backed by 3,000 reviews ranks above a 5.0 with 3 reviews — the
"where do people actually go" signal the project is built around.

Usage:  python build_cafes.py
Input:  zom_jaipur.csv   (Zomato Jaipur dataset, cp1252-encoded)
Output: cafes.json       (top-N cafés, mapped to the app schema)
"""

import pandas as pd
import re
import json
import unicodedata

CSV_PATH = "zom_jaipur.csv"
OUT_PATH = "cafes.json"
TOP_N = 40
M = 100  # reviews needed before a café's own rating outweighs the city average

# --- load (dataset is cp1252-encoded because of the "CAFÉ" accent) -----------
df = pd.read_csv(CSV_PATH, encoding="cp1252")


# --- helpers -----------------------------------------------------------------
def parse_count(s):
    """'137 Dining Reviews' -> 137 ; 'Not enough...' -> 0"""
    m = re.search(r"([\d,]+)", str(s))
    return int(m.group(1).replace(",", "")) if m else 0


def slugify(text):
    """'CAFÉ Bae' + area -> 'cafe-bae-...' (accents stripped, url-safe)."""
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text


def price_band(cost):
    try:
        c = float(cost)
    except (ValueError, TypeError):
        return "₹₹"
    if c <= 400:
        return "₹"
    if c <= 800:
        return "₹₹"
    return "₹₹₹"


def cuisines_list(s):
    out = []
    for c in str(s).split(","):
        c = c.strip()
        # 'Cafe'/'Café' is implied for every entry — drop as noise
        if c and c.lower() not in ("cafe", "café"):
            out.append(c)
    return out


def is_cafe(row):
    cat = str(row["category"]).lower()
    cui = str(row["Cuisine_offered"]).lower()
    nm = str(row["Name"]).lower()
    return ("caf" in cat) or ("coffee" in cui) or ("cafe" in nm or "café" in nm or "coffee" in nm)


# --- filter to cafés that genuinely offer dining + have a real rating --------
df["din_count"] = df["din_rev"].apply(parse_count)
cafes = df[df.apply(is_cafe, axis=1)].copy()
cafes = cafes[
    (cafes["avg_din_rate"].notna())
    & (cafes["offers_dining"] == "yes")
    & (cafes["din_count"] > 0)
].copy()

# drop duplicate listings (same id), keeping the one with more reviews
cafes["id"] = cafes.apply(lambda r: slugify(f"{r['Name']}-{r['Location']}"), axis=1)
cafes = cafes.sort_values("din_count", ascending=False).drop_duplicates("id")

# --- popularity: Bayesian weighted rating ------------------------------------
# score = (v/(v+m))*R + (m/(v+m))*C
#   R = this café's rating, v = its review count,
#   C = mean rating across all cafés, m = trust threshold
C = cafes["avg_din_rate"].mean()
v = cafes["din_count"]
R = cafes["avg_din_rate"]
cafes["popularity"] = (v / (v + M)) * R + (M / (v + M)) * C

top = cafes.sort_values("popularity", ascending=False).head(TOP_N).reset_index(drop=True)


# --- map to the app schema ---------------------------------------------------
def build_tags(row, cuisines):
    tags = cuisines[:3]
    if str(row["is_bar_available"]).lower() == "yes":
        tags.append("Bar")
    if str(row["is_vegeterian"]).lower() == "yes":
        tags.append("Pure Veg")
    if row["avg_din_rate"] >= 4.5:
        tags.append("Highly Rated")
    # dedupe, preserve order, cap at 4
    seen, out = set(), []
    for t in tags:
        if t.lower() not in seen:
            seen.add(t.lower())
            out.append(t)
    return out[:4]


def build_description(name, category, area, cuisines, rating, reviews):
    cat = category.split(",")[0].strip().title()
    if len(cuisines) >= 2:
        cphrase = f"{', '.join(cuisines[:-1])} and {cuisines[-1]}"
    elif cuisines:
        cphrase = cuisines[0]
    else:
        cphrase = "coffee and bites"
    return (
        f"A {cat.lower()} in {area} known for {cphrase}. "
        f"Rated {rating}/5 across {reviews:,}+ dining reviews."
    )


records = []
for i, row in top.iterrows():
    cuisines = cuisines_list(row["Cuisine_offered"])
    rating = round(float(row["avg_din_rate"]), 1)
    reviews = int(row["din_count"])
    name = str(row["Name"]).strip()
    area = str(row["Location"]).strip()
    category = str(row["category"]).replace("CAFÉ", "Café").strip()

    records.append({
        "id": row["id"],
        "name": name,
        "area": area,
        "price_band": price_band(row["cost_for_two"]),
        "veg_nonveg": "Veg" if str(row["is_vegeterian"]).lower() == "yes" else "Both",
        "cuisines": cuisines,
        "vibe_tags": build_tags(row, cuisines),
        "rating": rating,
        "review_count": reviews,
        "popularity_rank": i + 1,
        "url": str(row["Url"]).strip(),
        "authenticity": category.split(",")[0].strip(),
        "description": build_description(name, category, area, cuisines, rating, reviews),
        "hours": "",
        "seating": [],
        "menu_highlights": [],
        "images": [],
    })

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(records)} cafés to {OUT_PATH}")
print(f"City mean rating C={C:.2f}, trust threshold m={M}")
print("\nTop 5 by weighted popularity:")
for r in records[:5]:
    print(f"  {r['popularity_rank']}. {r['name']} ({r['area']}) "
          f"— {r['rating']}/5, {r['review_count']:,} reviews")