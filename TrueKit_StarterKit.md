# TrueKit — Project Starter Kit
> Outdoor gear intelligence platform. Honest, personalised, trust-first.
> Ready to paste into Cowork or any new Claude chat.

---

## 1. WHO I AM

- Name: Ross
- Background: MSc Artificial Intelligence student, University of Sheffield (graduating 2025–2026)
- Technical skills: TypeScript, Python, JavaScript, Next.js, Jest, Cypress, Java
- I am building this **solo** — no co-founder, no team yet
- I have an outdoor gear Instagram (@OutdoorGearStudio) and a weekly AI newsletter (Ainsight on Substack) — both are audience seeds for this product

---

## 2. THE PRODUCT — WHAT WE'RE BUILDING

### Product Name (working title): **TrueKit**
### Tagline: *"Gear intelligence you can actually trust."*

### One-sentence pitch:
Tell us who you are, what you own, and where you're going — we'll tell you exactly what gear you need and why, with zero sponsorship bias.

### The Core Problem:
Every gear review site online (GearJunkie, OutdoorGearLab, REI, Wirecutter) is structurally broken by affiliate revenue and sponsorship. Users cannot trust recommendations because the business model requires recommending products. This is getting **worse** as AI-generated review spam floods Google. There is no single platform that knows your body, your existing kit, your upcoming trips, and gives you a genuinely honest answer.

### The Solution — 4 pillars combined:
1. **AI Gear Advisor** — asks about your trip, body type, climate, budget → recommends exact gear
2. **Gear Locker** — your personal inventory of everything you own, mapped to gaps
3. **Honest Comparison Tool** — side-by-side specs with community-verified verdicts, no affiliate links
4. **Community Reviews by Use Case** — real adventurers review gear by actual trip type, not generic 5-stars

### Why these 4 must be combined:
- AI recommender is useless without knowing what you already own
- Gear tracker is useless without honest comparisons to reference
- Comparison tool is useless without real trust signals
- Community reviews are useless without personalisation to filter what's relevant to you

---

## 3. TARGET AUDIENCE

**Primary:** Hikers, trekkers, climbers, and multi-activity outdoor adventurers who:
- Spend £200–£2000+ per year on gear
- Spend hours researching before buying
- Are frustrated by sponsored content and generic reviews
- Range from enthusiast to semi-serious (not elite athletes)

**Secondary:** People planning a specific trip who need to know what gear they need for it

**Ross is the primary user** — he has personally gone through extensive gear research sessions for boots, base layers, sunglasses, backpacks, trekking poles, and climbing shoes. He understands the pain intimately.

---

## 4. MONETISATION MODEL

### Freemium → Subscription

**Free tier** (builds community & data):
- Build your Gear Locker (what you own)
- Browse community reviews
- Basic gear comparisons (limited per month)
- Contribute reviews

**Pro tier — ~£8–12/month (or ~£80–100/year):**
- Unlimited AI Gear Advisor sessions
- Full side-by-side comparisons with honest verdicts
- Trip-based gear gap analysis ("you're hiking Faroe Islands in June — here's what you're missing")
- Unlimited saved gear lists & wishlists
- Priority access to new gear coverage

### Why this model:
- Free users contribute the community data that makes the AI good
- Pro users pay to consume the intelligence
- No affiliate links = trust is the entire brand moat
- Predictable subscription revenue supports full-time growth

---

## 5. TECH STACK — LOCKED IN

| Layer | Technology | Notes |
|---|---|---|
| **Language** | TypeScript | Everything, everywhere — frontend + backend |
| **Framework** | Next.js 16 (App Router) | SaaS standard, React ecosystem, Server Components |
| **Styling** | Tailwind CSS + shadcn/ui | 51% dev adoption, accessible, maintainable |
| **API Layer** | tRPC | End-to-end type safety, no schema drift |
| **Database** | Supabase (PostgreSQL) | Auth + DB + Storage + Realtime in one platform |
| **ORM** | Prisma | Type-safe queries, clean migrations |
| **Payments** | Stripe | Subscriptions, trials, webhooks — industry standard |
| **Deployment** | Vercel | Zero-config Next.js, preview deployments, global CDN |
| **Email** | Resend | Modern transactional email, great DX |
| **Auth** | Supabase Auth (built-in) | Social login + email/password + magic links |
| **Mobile (later)** | React Native | Reuses TypeScript/React knowledge |
| **Desktop (later)** | Tauri | Lightweight, Rust-based, modern |

### Key architecture decisions:
- **Monorepo** — one Next.js app, API routes in `/app/api`, no separate backend service to start
- **Row Level Security (RLS)** on Supabase — security enforced at database level, not just app code
- **PostgreSQL with pgvector** — enables AI similarity search for gear recommendations later
- **Stripe webhooks** → Supabase to sync subscription state
- **TypeScript strict mode** — catch bugs at compile time, not in production

---

## 6. PROJECT STRUCTURE (recommended)

```
truekit/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, signup)
│   ├── (dashboard)/              # Protected app pages
│   │   ├── gear-locker/          # User's gear inventory
│   │   ├── advisor/              # AI gear advisor
│   │   ├── compare/              # Gear comparison tool
│   │   └── community/            # Community reviews
│   ├── (marketing)/              # Public landing pages
│   └── api/                      # tRPC + Stripe webhooks
├── components/
│   ├── ui/                       # shadcn/ui base components
│   └── features/                 # Feature-specific components
├── lib/
│   ├── supabase/                 # Supabase client + server helpers
│   ├── trpc/                     # tRPC router + procedures
│   ├── stripe/                   # Stripe helpers + webhook handlers
│   └── ai/                       # AI advisor logic (later)
├── prisma/
│   └── schema.prisma             # Database schema
├── types/                        # Shared TypeScript types
└── middleware.ts                 # Auth protection for dashboard routes
```

---

## 7. DATABASE SCHEMA (core tables to start)

```prisma
// prisma/schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  createdAt     DateTime @default(now())

  subscription  Subscription?
  gearItems     GearItem[]
  reviews       Review[]
  trips         Trip[]
}

model Subscription {
  id                 String   @id @default(cuid())
  userId             String   @unique
  stripeCustomerId   String   @unique
  stripePriceId      String
  status             String   // active | trialing | canceled | past_due
  currentPeriodEnd   DateTime
  createdAt          DateTime @default(now())

  user               User     @relation(fields: [userId], references: [id])
}

model GearItem {
  id          String   @id @default(cuid())
  userId      String
  productId   String   // links to Product
  status      String   // owned | wishlist | retired
  purchasedAt DateTime?
  notes       String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
}

model Product {
  id          String   @id @default(cuid())
  name        String
  brand       String
  category    String   // boots | base-layers | backpacks | etc.
  description String?
  specs       Json     // flexible spec storage
  imageUrl    String?
  createdAt   DateTime @default(now())

  gearItems   GearItem[]
  reviews     Review[]
  comparisons ComparisonProduct[]
}

model Review {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  rating      Int      // 1-5
  tripType    String   // hiking | climbing | skiing | etc.
  conditions  String?  // wet | alpine | summer | etc.
  body        String
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
}

model Trip {
  id          String   @id @default(cuid())
  userId      String
  name        String
  destination String
  startDate   DateTime?
  activity    String   // hiking | climbing | skiing | etc.
  duration    Int?     // days
  climate     String?
  gearList    Json?    // recommended gear snapshot
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 8. MVP SCOPE — PHASE 1 (what to build first)

**Goal:** Get to first paying user as fast as possible.

### Phase 1 MVP includes:
- [ ] Landing page with waitlist / signup CTA
- [ ] User auth (Supabase — email + Google)
- [ ] Gear Locker — add gear you own, categorised
- [ ] Basic product database (manually seeded — 50–100 items to start)
- [ ] Simple comparison tool — pick 2 products, see side-by-side specs
- [ ] Stripe subscription integration (free + pro tier)
- [ ] User dashboard with gear locker overview

### Phase 1 MVP excludes (later):
- AI Gear Advisor (needs data first)
- Community reviews (needs users first)
- Mobile app
- Trip planning

### Why this order:
- Gear Locker builds the data foundation the AI needs later
- Comparison tool delivers immediate value with zero AI complexity
- Subscription infrastructure in from day one — no retrofit pain later

---

## 9. ENVIRONMENT VARIABLES NEEDED

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase PostgreSQL)
DATABASE_URL=
DIRECT_URL=  # for Prisma migrations

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=
```

---

## 10. KEY COMMANDS TO KNOW

```bash
# Setup
npx create-next-app@latest truekit --typescript --tailwind --app
cd truekit

# Install core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @trpc/server @trpc/client @trpc/next @trpc/react-query
npm install @tanstack/react-query
npm install prisma @prisma/client
npm install stripe @stripe/stripe-js
npm install resend
npm install zod
npm install lucide-react
npx shadcn@latest init

# Database
npx prisma init
npx prisma generate
npx prisma db push       # push schema to Supabase
npx prisma studio        # visual DB browser

# Dev
npm run dev
```

---

## 11. COWORK TASK INSTRUCTIONS

When starting a new Cowork session, paste this entire document and say:

> "This is my project starter kit. I want to work on [specific task]. Please help me implement this using the tech stack and structure defined above."

### Good first tasks to give Cowork:
1. **"Set up the Next.js project with Supabase auth and a protected dashboard route"**
2. **"Build the Gear Locker page — user can add, view, and remove gear items"**
3. **"Create the Prisma schema and push to Supabase"**
4. **"Build a landing page with email waitlist signup"**
5. **"Set up Stripe subscription with free and pro tier"**
6. **"Build a product comparison component — side-by-side specs from two products"**

---

## 12. DESIGN PRINCIPLES

- **Trust over flash** — clean, honest UI. No dark patterns. No fake urgency.
- **Mobile-first** — outdoor users are on their phones planning trips
- **Fast by default** — Next.js Server Components, images optimised, minimal client JS
- **Accessible** — shadcn/ui is accessible by default, maintain this
- **Colour palette direction:** earthy, outdoorsy — greens, slates, warm neutrals. NOT neon SaaS blues.

---

## 13. BUSINESS CONTEXT

- Building full-time (post-MSc graduation 2025–2026)
- Target: first paying users within 3 months of build start
- Long-term: expand to mobile app (React Native), then desktop (Tauri)
- Geographic focus: UK + Europe initially (Ross is Sheffield-based, travels frequently across Europe)
- Ross has deep personal expertise in: hiking boots, base layers, backpacks, climbing gear, sunglasses, waterproofs — this is the initial content focus
- Competitor weakness to exploit: ALL major gear sites are affiliate-funded. TrueKit's entire moat is the absence of that conflict.

---

*Last updated: April 2026 | Stack locked, MVP scope defined, ready to build.*
