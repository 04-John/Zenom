# Zenom Studio

Rebuild of Zenom Studio — commissioned charcoal/pencil portraits, made to
order. "Art for People, Art for Spaces."

Tagline: **More than a portrait.** Portraits and abstract art (geometric,
minimalistic, figurative) by Samuel; Zenom Spaces is a "coming soon" page.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Neon) ·
Prisma · NextAuth · Framer Motion + Lenis · Netlify.

## Pricing model

`src/lib/pricing.ts` is the single source of truth for every price and size
(UI, API, WhatsApp message, email, seed). Price = category table x size +
optional framing + delivery + additional subjects (portraits only). Money is
stored in kobo. The server recomputes every price on `POST /api/orders` and
ignores anything the client sends. `npm run test:pricing` asserts the
reference totals.

## Getting started

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npx prisma migrate dev   # create tables from prisma/migrations
npx prisma db seed       # seed sizes, the 38 launch artworks and the admin user
npm run dev
```

Artwork images live in `public/art/` (about 1600px on the long edge;
`next/image` serves AVIF/WebP). To regenerate them from the design handoff:
`node scripts/prepare-art.mjs "<handoff>/assets/art"`.

### Artwork and admin scripts (`scripts/`)

All of these read `.env` via `node --env-file=.env`:

- `upload-art.mjs` — uploads `public/art/*.jpg` to Cloudinary (`zenom-studio/art`) and writes
  `src/lib/art-cloudinary.json`, which `catalog.ts` and the seed use for image URLs.
- `migrate-art-urls.mjs [--apply]` — points existing product images at those Cloudinary URLs (dry run by default).
- `replace-art.mjs w09=<file> …` — swaps in an updated artwork (resized to ~1600px); re-run `upload-art.mjs` after.
- `sync-catalog-names.ts [--apply]` — applies titles from `catalog.ts` to existing products (run with
  `node --env-file=.env node_modules/ts-node/dist/bin.js scripts/sync-catalog-names.ts`).
- `reset-admin-password.mjs [email]` — resets an existing admin's password (there is no forgot-password flow).
  Set `NEW_ADMIN_PASSWORD` to choose one, or a random one is printed once.
- `make-brand-pngs.mjs` — regenerates the apple-touch icon, social card and email logo PNGs from the brand SVGs.

### Existing database (created with `prisma db push`)

The repo had no migration history before the pricing overhaul, so the first
migration (`0_init`) is a baseline of the old schema. On a database that
already has those tables, mark it as applied, then deploy the rest:

```bash
npx prisma migrate resolve --applied 0_init
npx prisma migrate deploy   # runs 20261010000000_pricing_overhaul
npx prisma db seed
```

The overhaul migration maps old products (pillar/abstractStyle -> category),
old order items (size label/index; the old background track is appended to
the item notes) and old order totals, so existing orders stay readable.

Seeded admin login: email is `ADMIN_SEED_EMAIL` (defaults to
`zenomart.studio@gmail.com`). Set `ADMIN_SEED_PASSWORD` in `.env` before
seeding, or leave it unset and the seed script will generate and print a
random one-time password — copy it immediately, it's shown only once.

## Project structure

```
prisma/schema.prisma        Data model
prisma/seed.ts               Seed script (sizes, 38 artworks, admin user)
src/app/                     Routes (App Router)
src/app/api/                 API route handlers
src/components/layout/       Header, Footer, MobileNav
src/components/motion/       Lenis provider, scroll reveals, page transitions
src/components/product/      Product card/grid/customizer
src/components/cart/         Order bag
src/components/ui/           Button, Skeleton, EmptyState
src/context/CartContext.tsx  Cart state (persisted, key zenom.cart.v2)
src/lib/pricing.ts           Prices, sizes, totals (single source of truth)
src/lib/catalog.ts           The 38 launch artworks (titles, codes, images)
src/lib/                     Prisma client, auth config, WhatsApp/email helpers, Zod schemas
src/middleware.ts            Server-side route protection for /account, /studio
```

## What's scaffolded vs. what's still a stub

**Fully wired**: gallery and artwork detail (size, framing, subjects),
bag, checkout → order creation → WhatsApp handoff, email confirmation (via
Resend), customer auth, customer order history, admin dashboard, admin order
status management, admin product CRUD (category, image upload).

**Needs the owner**:
- The 38 artwork titles are placeholders from the design reference
  (`src/lib/catalog.ts`); rename them in `/studio/products` (re-seeding never
  overwrites a renamed product).
- Artwork images are served from `public/art/`. To host them on Cloudinary
  instead, upload them via the studio product form and replace the URLs.

## Deploying

1. Push this repo to GitHub.
2. Create a Neon Postgres database, copy its connection string into
   `DATABASE_URL`.
3. Connect the repo to Netlify, set the same env vars from `.env.example`
   in Netlify's dashboard.
4. Run `npx prisma migrate deploy && npx prisma db seed` against the
   production database once before first deploy (see "Existing database"
   above if it was created with `db push`).
