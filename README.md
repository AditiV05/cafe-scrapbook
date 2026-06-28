# ☕ Cafe Finder

[![Live Demo](https://img.shields.io/badge/Live-cafe--scrapbook.vercel.app-2ea44f?style=for-the-badge)](https://cafe-scrapbook.vercel.app)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> Find Jaipur's most-loved cafés — ranked by real reviews, searchable in plain English, guided by a pixel barista who has opinions.

**🌐 Live:** [cafe-scrapbook.vercel.app](https://cafe-scrapbook.vercel.app)

---

## 💭 The Story

Real talk: nobody _needs_ another café app. If you want chai, you'll find chai.

But a while back I got tired of hunting for _good_ cafés in Jaipur — the scroll-for-an-hour, open-twenty-tabs, still-end-up-at-the-wrong-place kind of tired. So I started building this. Then, like every great developer before me, I got bored and abandoned it in my archive to die a quiet death.

It sat there. Judging me.

So I revived it — and this time actually finished the job. Rebuilt it, ranked 44 genuinely good Jaipur cafés by real reviews (not vibes, not ads), and bolted on AI search that turns _"cheap continental place in C Scheme"_ into actual filters. The half-baked idea grew up.

Is it going to change your life? No. Will it help you find a solid café without losing an hour of yours? Honestly, yeah. And it's got a pixel barista mascot, so it's already winning.

This was never a necessary project. It was a naive little idea that turned out to have more potential than I gave it credit for — so I gave it the glow-up it deserved.

---

## 🤔 What This Actually Is

A café discovery app for Jaipur that does three things well:

1. **Ranks cafés by how loved they actually are** — using real ratings and review counts, not paid placement.
2. **Lets you search like a human** — type a normal sentence, an LLM figures out what you meant.
3. **Stays out of your way** — clean, fast, scannable cards. No login, no clutter, no 14 popups asking for your location.

44 hand-checked cafés, real data, one opinionated barista.

---

## 🤖 The AI Part (the fun bit)

The headline feature is **natural-language search**. Instead of fiddling with three dropdowns, you just _say_ what you want:

> _"cheap continental place in C Scheme"_
> _"italian near Malviya Nagar"_
> _"somewhere fancy for a date"_

…and the app fills in the right filters for you.

### How it works

```
User types a sentence
        │
        ▼
  /api/parse-search   ← Vercel serverless function (key stays server-side)
        │
        ▼
   Google Gemini      ← constrained prompt, temperature 0, JSON-only output
        │
        ▼
 { area, type, budget, keywords }
        │
        ▼
  Validated against the app's real filter values, then applied
```

A few decisions I'm glad I made:

- **The API key never touches the browser.** The Gemini call runs inside a Vercel serverless function (`/api/parse-search`), so the key lives in an environment variable on the server, not in client-side code. This is the single most common way people leak keys in side projects — so it was worth doing right.
- **The model can't make things up.** Gemini is prompted to return _strict JSON only_ (no prose, no markdown) and is told the exact list of valid areas, types, and budgets. Whatever it returns is then **validated against the app's real filter values** before anything is applied — so a hallucinated "area" or a typo'd cuisine just gets dropped instead of breaking the UI.
- **It fails gracefully.** No key, rate limit hit, weird response? The app quietly falls back to manual filters and the mascot says so, instead of throwing an error in your face.

### I didn't just build it — I measured it

There's an **evaluation harness** (`scripts/eval_search.js`) with a golden set of hand-written test sentences and their expected filter outputs. It hits the live endpoint, scores exact-match and field-level accuracy, and has retry/backoff so a flaky API call doesn't poison the results.

> Because _"I added AI"_ means nothing if you can't say how well it actually works.

On completed runs it scored **100% field-level accuracy** across the golden set. (Repeated runs hit the Gemini free-tier quota — which, fittingly, is exactly the kind of thing the retry/backoff logic exists for.)

---

## ✨ Other Features

- **⭐ Real popularity ranking** — cafés are ordered by a _Bayesian weighted rating_: a café's star rating weighted by how many reviews back it up. So a 4.9 with 3,000 reviews beats a perfect 5.0 with three. It's the "where do people _actually_ go" signal.
- **🎲 Surprise Me** — for the chronically indecisive. Picks a café from your current results.
- **🗂 Clean, image-free cards** — colour-coded by cuisine, leading with rating and reviews. Fast to scan, honest (no stock photos pretending to be the real place).
- **🐱 A pixel barista with opinions** — every single café has its own hand-written one-liner from the mascot. All 44 of them.
- **🗺 Detail pages** — embedded map, area, budget, and a link straight to the café's Zomato listing.

---

## 🛠 Tech Stack

| Layer          | Tool                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| **Framework**  | React 19 + Vite                                                            |
| **Styling**    | Tailwind CSS                                                               |
| **Routing**    | React Router DOM                                                           |
| **AI**         | Google Gemini (`gemini-2.5-flash`) for natural-language search             |
| **Backend**    | Vercel Serverless Functions                                                |
| **Data**       | Curated from a public Zomato Jaipur dataset (Kaggle) via a Python pipeline |
| **Deployment** | Vercel                                                                     |

---

## 🏗 Architecture

```
cafe-scrapbook/
├── src/                      # React frontend (pages, components, styles)
│   ├── pages/                # Home (grid + search) and CafeDetailsPage
│   ├── components/           # CafeCard, PixelMascot, filters, etc.
│   └── data/cafes.json       # The curated 44-café dataset the app reads
├── api/
│   └── parse-search.js       # Serverless function → proxies NL search to Gemini
└── scripts/
    ├── build_cafes.py        # Data pipeline: raw Zomato CSV → ranked cafes.json
    └── eval_search.js        # Accuracy harness for the AI search
```

- **Frontend** — a React + Vite single-page app, styled with Tailwind.
- **Data pipeline** (`build_cafes.py`) — ingests a ~4,700-row public Zomato Jaipur dataset, keeps cafés that actually offer dining and have real ratings, ranks them by weighted popularity, and emits the curated `cafes.json`.
- **Serverless API** (`parse-search.js`) — a Vercel Function that turns plain-English queries into structured filters via Gemini, keeping the API key server-side.
- **Eval** (`eval_search.js`) — measures how accurately the search maps sentences to filters.

---

## 🚀 Run Locally

```bash
git clone https://github.com/AditiV05/cafe-scrapbook.git
cd cafe-scrapbook
npm install
npm run dev
```

> **Heads up:** `npm run dev` runs only the frontend, so the AI search (which lives in a serverless function) won't work locally — it'll fall back to manual filters. To test AI locally, run `vercel dev` with a `GEMINI_API_KEY` environment variable. Or just try it on the [live site](https://cafe-scrapbook.vercel.app), where the function is deployed.

---

## 📊 Data Note

Café data is a snapshot derived from a public Zomato Jaipur dataset (Kaggle), processed via `scripts/build_cafes.py`, plus a handful of cafés added by hand. Ratings and review counts reflect that snapshot, not live data.

---

## 🛣 What's Next

The one thing I haven't built yet: a properly **interactive mascot** — more reactive, more playful, more alive. That was honestly my favourite part of the original vision, and it's the first thing I'd come back for.

---

## 👤 Author

**Aditi Vashishtha** — [GitHub](https://github.com/AditiV05)
