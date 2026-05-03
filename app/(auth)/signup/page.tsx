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

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your TrueKit account</CardTitle>
        <CardDescription>Start building your Gear Locker.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* AuthForm reads ?next + ?authError via useSearchParams; that bails
            out static generation unless wrapped in Suspense. */}
        <Suspense fallback={<div className="h-32" />}>
          <AuthForm mode="signup" />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
