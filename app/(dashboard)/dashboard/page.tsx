import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Your gear, your trips, your verdicts — all in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gear Locker</CardTitle>
            <CardDescription>Track what you own and what you want.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once you add gear, your Advisor sessions stop suggesting things you already have.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advisor</CardTitle>
            <CardDescription>Coming soon — Phase 2.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tell the AI Advisor about a trip and get a precise gear list with reasoning.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compare</CardTitle>
            <CardDescription>Side-by-side specs, no affiliate spin.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pick two products, see specs and verdicts from people who actually use them.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
