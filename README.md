# Zenom Studio

Rebuild of Zenom Studio — commissioned charcoal/pencil portraits, made to
order. "Art for People, Art for Spaces."

Launch scope: **Zenom Portraits only**. Zenom Abstract and Zenom Spaces
exist as real routes with real content but render **Coming Soon** until
their feature flags are flipped (see `.env.example`).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Neon) ·
Prisma · NextAuth · Framer Motion + Lenis · Netlify.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npx prisma db push     # create tables from schema.prisma
npx prisma db seed     # seed categories, sizes, background tracks, admin user
npm run dev
```

Seeded admin login: email is `ADMIN_SEED_EMAIL` (defaults to
`zenomart.studio@gmail.com`). Set `ADMIN_SEED_PASSWORD` in `.env` before
seeding, or leave it unset and the seed script will generate and print a
random one-time password — copy it immediately, it's shown only once.

## Project structure

```
prisma/schema.prisma        Data model
prisma/seed.ts               Seed script (categories, sizes, admin user)
src/app/                     Routes (App Router)
src/app/api/                 API route handlers
src/components/layout/       Header, Footer, MobileNav
src/components/motion/       Lenis provider, scroll reveals, page transitions
src/components/product/      Product card/grid/customizer
src/components/cart/         Order bag
src/components/ui/           Button, Skeleton, EmptyState
src/context/CartContext.tsx  In-memory cart state
src/lib/                     Prisma client, auth config, WhatsApp/email helpers, Zod schemas
src/middleware.ts            Server-side route protection for /account, /studio
```

## What's scaffolded vs. what's still a stub

**Fully wired**: portrait browsing, product customization (size +
background), cart, checkout → order creation → WhatsApp handoff, email
confirmation (via Resend), customer auth, customer order history, admin
dashboard, admin order status management, admin product CRUD (create/edit).

**Stubbed — needs finishing before production**:
- Email verification on signup (`/api/auth/signup` has a TODO — currently
  accounts are created without a verification step)
- Image upload flow (products currently expect image URLs already hosted
  somewhere — wire up Cloudinary upload in the admin product form)
- Product delete / archive in the admin UI
- Toast notification system (referenced in the design in spirit, not yet
  implemented as a component)
- Sentry initialization (`SENTRY_DSN` is in `.env.example` but the SDK
  isn't wired into `next.config.mjs` yet — run `npx @sentry/wizard@latest`
  once you have a DSN)
- Exact brand color hex values — `tailwind.config.ts` has close
  approximations pulled from the logo, swap for confirmed swatches
- Actual portrait pricing — `prisma/seed.ts` has placeholder size price
  modifiers, replace with Samuel's real pricing sheet

## Deploying

1. Push this repo to GitHub.
2. Create a Neon Postgres database, copy its connection string into
   `DATABASE_URL`.
3. Connect the repo to Netlify, set the same env vars from `.env.example`
   in Netlify's dashboard.
4. Run `npx prisma db push && npx prisma db seed` against the production
   database once (via Neon's SQL editor or a one-off script) before first
   deploy.
