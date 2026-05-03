import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/features/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your TrueKit account.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* AuthForm reads ?next + ?authError via useSearchParams; that bails
            out static generation unless wrapped in Suspense. */}
        <Suspense fallback={<div className="h-32" />}>
          <AuthForm mode="signin" />
        </Suspense>
        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            <Link
              href="/login/magic-link"
              className="font-medium text-primary hover:underline"
            >
              Email me a one-time link instead
            </Link>
          </p>
          <p>
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
