import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/features/sign-out-button";
import {
  Compass,
  Layers,
  ScaleIcon,
  Users,
  LayoutDashboard,
  CreditCard,
  UserCircle,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { tierFromSubscription } from "@/lib/subscription";
import { cn } from "@/lib/utils";

/**
 * Dashboard chrome — sidebar nav + header.
 *
 * Reads the user's subscription tier server-side so we can surface a small
 * "Pro" badge (members) or a quiet "Upgrade" chip (free) in the header.
 * Both are intentionally low-key: trust over funnel.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const sub = await db.subscription.findUnique({ where: { userId: user.id } });
  const tier = tierFromSubscription(sub);

  return (
    <div className="flex flex-1">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-secondary/30 p-4 sm:block">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 px-2 font-semibold tracking-tight"
        >
          <span className="inline-block size-6 rounded-md bg-primary" aria-hidden />
          TrueKit
        </Link>
        <nav className="flex flex-col gap-1 text-sm">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="size-4" />}>
            Overview
          </NavLink>
          <NavLink href="/gear-locker" icon={<Layers className="size-4" />}>
            Gear Locker
          </NavLink>
          <NavLink href="/advisor" icon={<Compass className="size-4" />}>
            Advisor
          </NavLink>
          <NavLink href="/compare" icon={<ScaleIcon className="size-4" />}>
            Compare
          </NavLink>
          <NavLink href="/community" icon={<Users className="size-4" />}>
            Community
          </NavLink>
          <div className="my-2 border-t border-border/60" />
          <NavLink href="/billing" icon={<CreditCard className="size-4" />}>
            Billing
          </NavLink>
          <NavLink href="/account" icon={<UserCircle className="size-4" />}>
            Account
          </NavLink>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3 text-sm">
          <Link
            href="/account"
            className="truncate text-muted-foreground transition-colors hover:text-foreground"
          >
            {user.email}
          </Link>
          <div className="flex items-center gap-2">
            <PlanChip tier={tier} />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-2 py-2 text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}

/**
 * Header tier chip.
 *
 * Pro:  small green pill, no link (it's a recognition signal, not a CTA).
 * Free: muted "Upgrade" chip linking to /billing — easy to find, easy to ignore.
 */
function PlanChip({ tier }: { tier: "free" | "pro" }) {
  if (tier === "pro") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        )}
      >
        <Sparkles className="size-3" />
        Pro
      </span>
    );
  }
  return (
    <Link
      href="/billing"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      )}
    >
      <Sparkles className="size-3" />
      Upgrade
    </Link>
  );
}
