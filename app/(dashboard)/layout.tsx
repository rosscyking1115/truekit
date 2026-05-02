import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/features/sign-out-button";
import { Compass, Layers, ScaleIcon, Users, LayoutDashboard } from "lucide-react";

/**
 * Dashboard chrome — sidebar nav + header.
 * Middleware already gates this group; the redirect here is belt-and-braces
 * (and gives us the user object for the header without an extra fetch).
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
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-3 text-sm">
          <span className="text-muted-foreground">{user.email}</span>
          <SignOutButton />
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
