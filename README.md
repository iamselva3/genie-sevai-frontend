# Genie Sevai — customer web app

The customer website for **Genie Sevai**, a home-services platform. Customers can book verified professionals for cleaning, salon, AC repair, plumbing, electrical work and more. They pick a slot and pay after the job.

| Repo | What |
| --- | --- |
| **genie-sevai-frontend** (this) | Customer web app, plus the end-to-end test suite in `e2e/` |
| [genie-sevai-backend](https://github.com/iamselva3/genie-sevai-backend) | REST API (Express + MongoDB) |
| [genie-sevai-admin](https://github.com/iamselva3/genie-sevai-admin) | Admin panel + professional portal |

Stack: React 18, Vite, Tailwind CSS v4, TanStack Query and React Router. Fonts are self-hosted, and the 3D effects are pure CSS.

> **Branch `design-v2`** is an alternative look for the same app.
> - Blue and white, with soft cards and shadows, one clean sans font (Geist), and hand-drawn soft-3D SVG artwork for every category and banner.
> - The layout is a familiar home-services structure: the header shows the next free slot and your address; the left side has a category grid; the right side has offer banners and promises; a pill nav sits at the bottom.
> - It uses the same API, routes and tests as `main`. Only the presentation differs.

## Run

You need the API running first (see genie-sevai-backend; `npm run dev:memory` there needs no database).

```bash
npm install
npm run dev        # http://localhost:5273
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ on :5273
npm test           # unit tests (Vitest)
```

The API address comes from `VITE_API_URL` (default `http://localhost:5100/api/v1`). For production, set it at build time:

```bash
VITE_API_URL=https://api.example.com/api/v1 npm run build
```

Host `dist/` as a static site with an SPA fallback, so unknown paths serve `index.html`.

## What's inside

- **Splash screen** (`index.html`): plain HTML/CSS, so it is the first paint. It plays once per session.
  - On blue, the Genie lamp spins in on a 3D axis, its smoke draws a house roof and sparkles pop.
  - "Genie" rises letter by letter, the smile draws, and the "Sevai" tag lands.
  - The screen then splits open onto the app.
- **Header**: logo; "Next slot ‹time›" (the earliest free slot, live from the API) with your saved address (tap to change city); a wide search bar (Ctrl/⌘K); cart and account. A floating pill navigation sits at the bottom.
- **Home**:
  - "What do you need help with?" grid of illustrated category tiles with "from ₹" badges, plus quick fixes under ₹500.
  - Offer banners.
    - Bathroom deep clean, with rising bubbles and a live price seal.
    - The coupons, whose "Book now" pre-applies the code.
    - AC service.
  - Our promises.
  - Shelves: spotlight, most booked, and rows for individual categories (cards with artwork, a discount tag and a group tag).
  - "How it works", and a footer.
- **Artwork** (`src/components/art.tsx`):
  - Soft-3D SVG illustrations, picked by each category's icon key (admins choose the key).
  - Banner scenes.
  - Solid tones only, no bitmaps.
- **Booking flow**: category → service sheet → cart (one category at a time, coupons, server-side prices) → OTP sign-in → address → live slots → pay after service → confirmation.
- **Bookings**: live status, a 4-digit service PIN, the assigned professional, reschedule, cancel and rating.
- **Other pages**: account, help desk, become a professional, terms and privacy.
- **Design rules**: blue and white with dark text, and no gradients (a test enforces this). No browser `alert`/`confirm` pop-ups.

## Brand

The logo is a Genie-style magic lamp whose smoke rises to draw a house roof. The wordmark is "Genie" with the Genie smile underneath and "Sevai" on a tag. On this branch it is drawn in blue and white. It lives in:
- `src/components/shell.tsx` (`LogoMark`, `Wordmark`)
- `public/favicon.svg`
- the splash screen in `index.html`

## End-to-end tests (`e2e/`)

There are 30 Playwright tests, run on desktop Chrome and a Pixel 7. They start all three apps themselves: the API on a fresh in-memory MongoDB, and production builds of this app and the admin panel. They expect the other repos cloned next to this one:

```
some-folder/
  genie-sevai-frontend/   (this repo)
  genie-sevai-backend/
  genie-sevai-admin/
```

```bash
# install dependencies in all three repos first
cd e2e
npm install
npx playwright install chromium
npm test
# ports busy? E2E_API_PORT=5101 E2E_WEB_PORT=5373 E2E_ADMIN_PORT=5374 npm test
# other folder names? E2E_BACKEND_DIR=... E2E_ADMIN_DIR=... npm test
```

The tests cover:
- the splash screen and the no-gradient rule
- browsing, search and city availability
- the one-category cart and coupons
- booking end to end with OTP, then reschedule and cancel
- account and forms
- admin control of service and category visibility, as seen by customers
- assigning a professional → on the way → start with the PIN → complete → rating
- double-booking protection
- the phone layout

## Performance

These are Lighthouse 12 scores on the production build. "Mobile" uses Lighthouse's simulated slow-4G connection and 4× slower CPU.

| Page | Mobile | Desktop |
| --- | --- | --- |
| Home | 94 | 99 |
| Category | 92 | 99 |
| Explore | 93 | — |

Accessibility, best practices and SEO score 100.

How it stays fast:
- The artwork is inline SVG (no image downloads), and only one font file is loaded.
- 3D effects use CSS transforms.
- Routes are code-split.
- Fonts are preloaded.
- Off-screen shelves mount only when scrolled near and use `content-visibility`.
- Banner slides build their content only once shown.
