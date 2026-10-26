"""
fetch_cafe_photos.py — give every café on the details page its own photo.

For each café in src/data/cafes.json, finds the cover photo on its Zomato
page, saves it to public/cafes/<id>.jpg, and sets that café's
"images" to ["/cafes/<id>.jpg"]. The photos are self-hosted so the page
doesn't depend on hotlinking Zomato's CDN.

Cafés that already have a photo file are skipped, so re-running only fills
gaps. Pass --force to download them all again.

Usage:  python3 scripts/fetch_cafe_photos.py [--force]
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
# Restaurant photos live on Zomato's CDN. The page's og:image tag can't be
# trusted (it often holds the page's own path), so take the first CDN photo
# anywhere in the page, which is the cover photo at the top.
CDN_PHOTO = re.compile(
    r"https://b\.zmtcdn\.com/data/(?:pictures|reviews_photos)/"
    r"[^\s\"'<>?]+?\.(?:jpe?g|png|webp)",
    re.I,
)
# Magic bytes of JPEG, PNG and WebP, so an error page is never saved as a photo.
IMAGE_MAGIC = (b"\xff\xd8\xff", b"\x89PNG", b"RIFF")


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def cover_photo_url(page_url):
    html = get(page_url).decode("utf-8", errors="replace")
    # Photo URLs in the page's embedded JSON have their slashes escaped.
    html = html.replace("\\u002F", "/").replace("\\/", "/")
    m = CDN_PHOTO.search(html)
    return m.group(0) if m else None


def download_photo(url):
    # Ask the CDN for a 1200x675 crop first; the original can be several MB.
    for candidate in (url + "?fit=around%7C1200:675&crop=1200:675;*,*", url):
        try:
            data = get(candidate)
        except Exception:
            continue
        if data.startswith(IMAGE_MAGIC):
            return data
    raise ValueError(f"couldn't download an image from {url}")


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
                raise ValueError("no photo found on the Zomato page")
            out.write_bytes(download_photo(photo))
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
