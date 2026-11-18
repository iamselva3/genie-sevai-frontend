# Genie Sevai — customer web app

The customer website for **Genie Sevai**, a home-services platform. Customers can book verified professionals for cleaning, salon, AC repair, plumbing, electrical work and more. They pick a slot and pay after the job.

| Repo | What |
| --- | --- |
| **genie-sevai-frontend** (this) | Customer web app, plus the end-to-end test suite in `e2e/` |
| [genie-sevai-backend](https://github.com/iamselva3/genie-sevai-backend) | REST API (Express + MongoDB) |
| [genie-sevai-admin](https://github.com/iamselva3/genie-sevai-admin) | Admin panel + professional portal |

Stack: React 18, Vite, Tailwind CSS v4, TanStack Query and React Router. Fonts are self-hosted, and the 3D effects are pure CSS.

## Run

You need the API running first (see genie-sevai-backend; `npm run dev:memory` there needs no database).

```bash
npm install
npm run dev        # http://localhost:5273
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ on :5273
npm test           # unit tests (Vitest)
```

Settings (see `.env.example`; put local values in `.env.local`). Both are read at build time:
- `VITE_API_URL`: the API address (default `http://localhost:5100/api/v1`).
- `VITE_GOOGLE_CLIENT_ID`: the Google OAuth client ID for **Continue with Google** (the same ID as `GOOGLE_CLIENT_ID` on the backend). Each address the site runs on (for example `http://localhost:5273` and the live domain) must be listed under the client's **Authorized JavaScript origins** in Google Cloud Console.

```bash
VITE_API_URL=https://api.example.com/api/v1 VITE_GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com npm run build
```

Host `dist/` as a static site with an SPA fallback, so unknown paths serve `index.html`.

## What's inside

- **Splash screen** (`index.html`): plain HTML/CSS, so it is the first paint. It plays once per session.
  - The Genie lamp spins in on a 3D axis, its smoke draws a house roof and sparkles pop.
  - "Genie" rises letter by letter, the smile draws, and the "Sevai" tag lands.
  - The screen then splits open like doors.
- **Header**: logo, "In ‹city›" with the saved address, a wide search bar (Ctrl/⌘K), cart and account. A floating pill navigation sits at the bottom.
- **Home**:
  - "What do you need help with?" category grid and quick fixes.
  - An offer carousel that rotates in 3D. Its first banner holds a spinning category cube; the coupon banners pre-apply their code.
  - Our promises.
  - Shelves: spotlight, most booked, and rows for individual categories.
  - A 3D "how it works" stack, a city ticker tape, and a ticket-style sign-off.
- **Booking flow**: category → service sheet → cart (one category at a time, coupons, server-side prices) → Continue with Google (the mobile number is asked once, for the professional) → address → live slots → pay after service → confirmation.
- **Bookings**: live status, a 4-digit service PIN, the assigned professional, reschedule, cancel and rating.
- **Other pages**: account, help desk, become a professional, terms and privacy.
- **Design rules**: black, white and yellow only, with no gradients (a test enforces this). No browser `alert`/`confirm` pop-ups.

## Brand

The logo is a Genie-style magic lamp whose smoke rises to draw a house roof. The wordmark is "Genie" with the Genie smile underneath and "Sevai" on a yellow tag. It lives in:
- `src/components/shell.tsx` (`LogoMark`, `Wordmark`)
- `public/favicon.svg`
- the splash screen in `index.html`

## End-to-end tests (`e2e/`)

There are 29 Playwright tests, run on desktop Chrome and a Pixel 7. They start all three apps themselves: the API on a fresh in-memory MongoDB, and production builds of this app and the admin panel. They expect the other repos cloned next to this one:

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
- booking end to end with Google sign-in and the mobile-number step, then reschedule and cancel. Google's script is replaced with a stand-in in the browser, and the test API accepts signed test tokens.
- account and forms
- admin control of service and category visibility, as seen by customers
- assigning a professional → on the way → start with the PIN → complete → rating
- double-booking protection
- the phone layout

## Performance

These are Lighthouse 12 scores on the production build. "Mobile" uses Lighthouse's simulated slow-4G connection and 4× slower CPU.

| Page | Mobile | Desktop |
| --- | --- | --- |
| Home | 95 | 99 |
| Category | 94 | 98 |
| Explore | 95 | — |

Accessibility, best practices and SEO score 100.

How it stays fast:
- 3D is done with CSS transforms.
- Routes are code-split.
- Fonts are preloaded.
- Off-screen shelves mount only when scrolled near and use `content-visibility`.
- The banner cube is built once the browser is idle.
