import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Layers, ScaleIcon, Users, ShieldCheck } from "lucide-react";
import { WaitlistForm } from "@/components/features/waitlist-form";

/**
 * Landing page — the public face of TrueKit.
 * Earthy palette, trust-first copy, single waitlist CTA above the fold.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="border-b border-border/60 bg-gradient-to-b from-background to-secondary/40">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Zero affiliate links. Zero sponsored verdicts.
            </span>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Gear intelligence you can{" "}
              <span className="text-primary">actually trust.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              Tell us who you are, what you own, and where you&apos;re going.
              We&apos;ll tell you exactly what gear you need and why — without
              the affiliate-driven nonsense plaguing every other review site.
            </p>

            <div className="mt-10 w-full max-w-md">
              <WaitlistForm />
              <p className="mt-3 text-xs text-muted-foreground">
                Join the waitlist. Early users get lifetime founding pricing.
              </p>
            </div>
          </div>
        </section>

        {/* The four pillars */}
        <section className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Four pillars. Useless apart, powerful together.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every other gear site nails one piece. TrueKit ties them
              together — that&apos;s where honest recommendations come from.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Pillar
              icon={<Compass className="size-5" />}
              title="AI Gear Advisor"
              body="Tell us your trip, body, climate, budget. Get a specific recommendation with the reasoning, not a vibes-based shortlist."
            />
            <Pillar
              icon={<Layers className="size-5" />}
              title="Gear Locker"
              body="Track everything you own. The Advisor uses it to fill gaps instead of telling you to buy what you already have."
            />
            <Pillar
              icon={<ScaleIcon className="size-5" />}
              title="Honest Comparison"
              body="Side-by-side specs with verdicts from the community — not from whichever brand cuts the bigger affiliate cheque."
            />
            <Pillar
              icon={<Users className="size-5" />}
              title="Reviews by Use Case"
              body="Boots reviewed for Faroe Islands wet bog walking, not generic 5-star averages. The detail you actually need."
            />
          </div>
        </section>

        {/* Why */}
        <section className="border-y border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Why we&apos;re building this
            </h2>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              Every major gear review site is structurally compromised by
              affiliate revenue and sponsorships. AI-generated review spam is
              making it worse. The result: hours of research, dozens of tabs,
              and no idea who to believe.
            </p>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              TrueKit makes money from <strong>members</strong>, not brands.
              That&apos;s the whole product.
            </p>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to stop second-guessing every purchase?
          </h2>
          <div className="mx-auto mt-8 max-w-md">
            <WaitlistForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block size-6 rounded-md bg-primary" aria-hidden />
          TrueKit
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get early access</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <span>&copy; {new Date().getFullYear()} TrueKit. Built in Sheffield.</span>
        <span>No affiliate links. Ever.</span>
      </div>
    </footer>
  );
}
