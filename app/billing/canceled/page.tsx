import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BillingCanceledPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout canceled</h1>
      <p className="text-sm text-muted-foreground">
        No charge made. Come back whenever — your account is unchanged.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/billing">Back to billing</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
