

https://github.com/user-attachments/assets/09856ffe-36af-4b47-8281-3ae44b5bc93d

# ☕ Cafe Finder

[![Live Demo](https://img.shields.io/badge/Live-cafe--scrapbook.vercel.app-2ea44f?style=for-the-badge)](https://cafe-scrapbook.vercel.app)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)

> A modern café discovery web app for Jaipur — find cafés by **vibe, budget, and area**, guided by a pixel barista mascot. Built with a focus on product logic, usability, and clarity over visual decoration.

---

## 🌐 Live Demo

**[cafe-scrapbook.vercel.app](https://cafe-scrapbook.vercel.app)**

---

## 🎯 The Problem

Finding a café that actually fits your mood — work-friendly, calm, aesthetic, on-budget — is harder than it should be. Most platforms:

- Overwhelm users with irrelevant data
- Don't allow intuitive filtering
- Focus on visuals over decision-making

**Cafe Finder** solves this with fast discovery, meaningful filters, and a calm, focused browsing experience.

---

## ✨ Features

### 🔍 Smart Search & Filters
Search cafés by name, description, or vibe. Filter by **budget**, **area**, and **vibe** (calm, rooftop, work-friendly, etc.).

### 🗂 Scannable Café Cards
Clean cards showing essentials at a glance — name, area, price band, vibe tags. Entire card is clickable for better UX.

### 📄 Café Details Page
Each café has a dedicated page with description, menu highlights, seating options, hours, and location. Gracefully handles missing data.

### 🎲 "Surprise Me" Interaction
Randomly highlights a café from the current filter set and scrolls it into view — a lightweight discovery aid for indecisive users.

### 🐱 Pixel Barista Mascot
A custom pixel-art barista that follows you across the experience as a recurring "café guide." Built as a reusable component with `mood` and `size` props — the mascot's glow halo adapts to context (cosy, chill, playful, night). Adds personality and product polish without compromising usability. Small detail, big difference.

### 🧭 Clean Routing
SPA navigation via React Router with clean URLs (`/cafe/:id`) and natural back-navigation.

---

## 🧠 Design Philosophy

This project intentionally avoids over-decoration. The principles I followed:

- **Clarity over aesthetics**
- **Restraint over novelty**
- **Consistency over creativity**
- **Usability before visual delight**

Visual polish is layered *only after* product logic is sound. The UI is designed to feel calm, trustworthy, modern, and scalable.

---

## 🛠 Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| Data | JSON-based mock dataset |
| Deployment | Vercel |

---

## 🚀 Run Locally

```bash
git clone https://github.com/AditiV05/cafe-scrapbook.git
cd cafe-scrapbook
npm install
npm run dev
```

---

## 👤 Author

**Aditi Vashishtha** — [GitHub](https://github.com/AditiV05) 
