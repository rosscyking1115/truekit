import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MagicLinkForm } from "@/components/features/magic-link-form";

export default function MagicLinkPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with a one-time link</CardTitle>
        <CardDescription>
          We&apos;ll email you a link that signs you in for one session. No password needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MagicLinkForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Prefer a password?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in normally
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
