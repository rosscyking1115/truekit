# TrueKit

> Gear intelligence you can actually trust.
> Outdoor gear platform — honest, personalised, zero affiliate links.

## Stack

- **Next.js 16** (App Router, Server Components) on **TypeScript** strict
- **Tailwind CSS v4** + **shadcn/ui** (earthy-stone theme)
- **tRPC v11** for end-to-end-typed API
- **Supabase** — Postgres + Auth + Storage
- **Prisma** for the schema and queries
- **Stripe** subscriptions (free + pro tiers, webhook → Supabase sync)
- **Resend** for transactional email
- **Vercel** for deploy

## Getting started

```bash
# 1. Install
npm install

# 2. Copy env template and fill in real values
cp .env.example .env.local

# 3. Generate Prisma client + push schema to your Supabase project
npm run db:generate
npm run db:push

# 4. Run dev server
npm run dev
```

Open <http://localhost:3000>.

### Required external services

You'll need accounts for these to actually run end-to-end. The dev server
*will* boot without them — pages render, but auth/db/billing calls fail.

| Service  | What you create                                              | Variables it fills                                                                                |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Supabase | New project (free tier)                                      | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL` |
| Stripe   | Test-mode account + one Pro price                            | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`                  |
| Stripe   | Local webhook listener: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` | `STRIPE_WEBHOOK_SECRET`                                                                           |
| Resend   | API key (free tier)                                          | `RESEND_API_KEY`                                                                                  |

## Project layout

```
truekit/
├── app/
│   ├── (auth)/                  # /login, /signup
│   ├── (dashboard)/             # /dashboard, /gear-locker, /advisor, /compare, /community (gated)
│   ├── api/
│   │   ├── trpc/[trpc]/         # tRPC HTTP entrypoint
│   │   └── webhooks/stripe/     # Stripe webhook → DB sync
│   ├── layout.tsx               # Root layout (TRPCProvider, fonts, metadata)
│   └── page.tsx                 # Landing page + waitlist
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   └── features/                # waitlist-form, auth-form, sign-out-button
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── trpc/{server,context,client.tsx,routers/}
│   ├── stripe/{client,webhooks}.ts
│   ├── env.ts                   # zod-validated env
│   ├── db.ts                    # Prisma singleton
│   └── utils.ts                 # `cn` helper
├── prisma/schema.prisma
├── middleware.ts                # auth gate for /dashboard/* etc.
└── .env.example
```

## Phase 1 scope (what's wired vs. what's stubbed)

**Wired:**
- Landing page + waitlist tRPC mutation
- Supabase auth (email/password + Google OAuth)
- Protected `/dashboard` routes via middleware
- tRPC server, context (with auth + Prisma), `gearLocker` and `waitlist` routers
- Prisma schema (User, Subscription, Product, GearItem, Review, Trip, WaitlistEntry)
- Stripe webhook handler + subscription upsert/delete handlers
- Earthy-stone shadcn/ui theme, Tailwind v4

**Stubbed / placeholder:**
- Gear Locker UI (data layer ready, UI is a placeholder card)
- Comparison UI (Phase 1.5 — needs seeded catalog)
- AI Gear Advisor (Phase 2 — needs Locker data first)
- Community reviews (Phase 2 — needs users)

## Scripts

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Next.js dev server                            |
| `npm run build`      | Production build                              |
| `npm run typecheck`  | `tsc --noEmit`                                |
| `npm run lint`       | ESLint                                        |
| `npm run db:generate`| Generate Prisma client                        |
| `npm run db:push`    | Push schema to Supabase (no migration files)  |
| `npm run db:migrate` | Create + run a new migration                  |
| `npm run db:studio`  | Prisma Studio (visual DB browser)             |

## Conventions

- Server Components by default. Drop `"use client"` only when you need state, effects, or browser APIs.
- All env access goes through `lib/env.ts` (zod-validated).
- Server-only modules import `"server-only"` to fail loudly if accidentally pulled into a Client Component.
- tRPC procedures are the only way client → server data flow is allowed (no raw `fetch` to `/api/*`).
- DB writes go through tRPC mutations or Server Actions, never directly from a Client Component.
- Tailwind v4 — no `tailwind.config.js`. Theme tokens live in `app/globals.css`.

## Deploying

1. Push to GitHub.
2. Import the repo on Vercel.
3. Set all env vars from `.env.example` in Vercel project settings.
4. In Stripe → Webhooks, add `https://<your-domain>/api/webhooks/stripe` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Deploy.

## License

Proprietary — all rights reserved (for now).
