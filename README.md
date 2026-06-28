# ☕ Cafe Finder

[![Live Demo](https://img.shields.io/badge/Live-cafe--scrapbook.vercel.app-2ea44f?style=for-the-badge)](https://cafe-scrapbook.vercel.app)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)

> Discover Jaipur's most-loved cafés — ranked by real ratings and thousands of reviews, searchable in plain English, guided by a pixel barista mascot.

## 🌐 Live Demo

**[cafe-scrapbook.vercel.app](https://cafe-scrapbook.vercel.app)**

## 🎯 The Problem

Picking a café is a _mood_ decision — "somewhere cheap to work," "a nice place for a date" — but most platforms bury that under noise and rank by paid promotion, not by where people actually go. Cafe Finder answers one question well: **which cafés do people in Jaipur genuinely love, and which fits what I want right now?**

## ✨ Features

### ⭐ Real popularity ranking

Cafés are ranked by a **Bayesian weighted rating** — a café's star rating weighted by its review volume — so a 4.9 backed by 3,000 reviews outranks a 5.0 with three. This is the "where people actually go" signal, not raw stars.

### 🔍 Natural-language search

Type a plain sentence like _"cheap continental place in C Scheme"_ and an LLM translates it into structured filters (area, type, budget). The model is constrained to the app's real filter vocabulary, so it can't invent options that don't exist.

### 🗂 Scannable café cards & detail pages

Clean cards show rating, review count, area, price band, and tags at a glance. Each café has a detail page with an embedded map and a "view on Zomato" link. Missing data is handled gracefully.

### 🎲 "Surprise Me" + 🐱 pixel barista mascot

A lightweight discovery aid for the indecisive, and a reusable mascot component (with `mood` and `size` props) that reacts to search state — adding personality without clutter.

## 🏗 Architecture

- **Frontend** (`src/`) — React + Vite SPA, Tailwind styling, React Router.
- **Data pipeline** (`scripts/build_cafes.py`) — ingests a ~4,700-row public Zomato Jaipur dataset, filters to cafés that offer dining and have real ratings, ranks them by weighted popularity, and emits the curated `cafes.json` the app reads.
- **Serverless API** (`api/parse-search.js`) — a Vercel Function that proxies the natural-language search to the Gemini API, so the API key stays server-side and never reaches the browser.

## 🛠 Tech Stack

| Layer      | Tool                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| Framework  | React 19 + Vite                                                          |
| Styling    | Tailwind CSS                                                             |
| Routing    | React Router DOM                                                         |
| Data       | Curated from public Zomato Jaipur dataset (Kaggle) via a Python pipeline |
| AI         | Google Gemini (natural-language search)                                  |
| Deployment | Vercel (static frontend + serverless functions)                          |

## 🚀 Run Locally

```bash
git clone https://github.com/AditiV05/cafe-scrapbook.git
cd cafe-scrapbook
npm install
npm run dev
```

## 👤 Author

**Aditi Vashishtha** — [GitHub](https://github.com/AditiV05)
