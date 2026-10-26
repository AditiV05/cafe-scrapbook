"""
fetch_cafe_photos.py — give every café on the details page its own photo.

For each café in src/data/cafes.json, reads the cover photo (og:image) from
its Zomato page, saves it to public/cafes/<id>.jpg, and sets that café's
"images" to ["/cafes/<id>.jpg"]. The photos are self-hosted so the page
doesn't depend on hotlinking Zomato's CDN.

Cafés that already have a photo file are skipped, so re-running only fills
gaps. Pass --force to download them all again.

Usage:  python scripts/fetch_cafe_photos.py [--force]
"""

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "src" / "data" / "cafes.json"
PHOTO_DIR = ROOT / "public" / "cafes"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}
OG_IMAGE = re.compile(
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']'
    r'|<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
    re.I,
)


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def cover_photo_url(page_url):
    html = get(page_url).decode("utf-8", errors="replace")
    m = OG_IMAGE.search(html)
    if not m:
        return None
    url = (m.group(1) or m.group(2)).replace("&amp;", "&")
    # Zomato's og:image is a small crop; ask the CDN for a wider one.
    return re.sub(r"\?.*$", "", url) + "?fit=around|1200:675&crop=1200:675;*,*"


def main():
    force = "--force" in sys.argv
    cafes = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    found, missing = 0, []

    for cafe in cafes:
        out = PHOTO_DIR / f"{cafe['id']}.jpg"
        if out.exists() and not force:
            cafe["images"] = [f"/cafes/{out.name}"]
            found += 1
            continue
        try:
            photo = cover_photo_url(cafe["url"]) if cafe.get("url") else None
            if not photo:
                raise ValueError("no og:image on page")
            out.write_bytes(get(photo))
            cafe["images"] = [f"/cafes/{out.name}"]
            found += 1
            print(f"  ok   {cafe['name']}")
        except Exception as e:  # keep going; one bad page shouldn't stop the rest
            missing.append(cafe["name"])
            print(f"  FAIL {cafe['name']}: {e}")
        time.sleep(1)  # be polite to Zomato

    DATA_PATH.write_text(
        json.dumps(cafes, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print(f"\n{found}/{len(cafes)} cafés have a photo.")
    if missing:
        print("Still missing: " + ", ".join(missing))


if __name__ == "__main__":
    main()
