import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangeEmailForm } from "@/components/features/change-email-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tierFromSubscription } from "@/lib/subscription";
import { Sparkles } from "lucide-react";

/**
 * Account settings.
 *
 * What's here today:
 *   - Current email
 *   - Linked sign-in identities (email, Google)
 *   - Change-email form (sends confirmation link to new address)
 *
 * Future additions: change-password (when signed in via password), delete
 * account, sessions list, two-factor auth.
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // identities lists each provider the user can sign in with.
  const identities = user.identities ?? [];

  const sub = await db.subscription.findUnique({ where: { userId: user.id } });
  const tier = tierFromSubscription(sub);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how you sign in to TrueKit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Plan</CardTitle>
              <CardDescription>
                {tier === "pro"
                  ? "TrueKit Pro · thanks for keeping the lights on."
                  : "Free plan · upgrade whenever you want more."}
              </CardDescription>
            </div>
            {tier === "pro" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="size-3" />
                Pro
              </span>
            ) : (
              <Badge variant="muted">Free</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Link
            href="/billing"
            className="text-sm text-primary hover:underline"
          >
            {tier === "pro" ? "Manage your subscription →" : "See what's in Pro →"}
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current email</CardTitle>
          <CardDescription>
            This is the email we use for sign-in and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="font-medium">{user.email}</span>
            {user.email_confirmed_at ? (
              <Badge variant="default">Verified</Badge>
            ) : (
              <Badge variant="muted">Unverified</Badge>
            )}
          </div>

          <ChangeEmailForm currentEmail={user.email ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sign-in methods</CardTitle>
          <CardDescription>
            Identities linked to this account. Adding Google here means future
            Google sign-ins land in this same account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {identities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No identities — odd. Sign in again.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {identities.map((id) => (
                <li
                  key={id.identity_id}
                  className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                >
                  <span className="capitalize">{id.provider}</span>
                  {id.created_at && (
                    <span className="text-xs text-muted-foreground">
                      Added{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                      }).format(new Date(id.created_at))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
