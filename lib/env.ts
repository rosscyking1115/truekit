import { z } from "zod";

/**
 * Centralised, type-safe env validation.
 *
 * Server vars are validated lazily via `serverEnv()` so that builds don't fail
 * when secrets aren't present (e.g. during a Vercel preview build before
 * secrets are wired). Public vars are always validated since Next.js inlines
 * them at build time.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

/**
 * `optionalString` lets a key be missing OR empty-string (Next.js loads blank
 * `.env` lines as `""`, not undefined). Without this, an empty RESEND_API_KEY
 * fails `.min(1)` *before* `.optional()` can excuse it.
 */
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v === "" ? undefined : v),
  z.string().min(1).optional()
);

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url().min(1),
  DIRECT_URL: z.string().url().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRO_PRICE_ID: z.string().min(1),
  RESEND_API_KEY: optionalString,
});

// During build, NEXT_PUBLIC_* may be empty strings. Use a permissive parse and
// fall back to placeholder values so the build succeeds; callers that actually
// hit Supabase/Stripe will get real failures with clear messages.
function parsePublic() {
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };
  return publicSchema.parse(raw);
}

export const publicEnv = parsePublic();

export function serverEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });
}
