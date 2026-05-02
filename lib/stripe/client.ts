import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

/**
 * Server-side Stripe client. Lazy so we don't crash on import if STRIPE_SECRET_KEY
 * is missing during a partial build — only callers that actually use it fail loudly.
 */
let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const env = serverEnv();
  _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    // Keep on default API version so the typings match the installed @types.
    typescript: true,
    appInfo: {
      name: "TrueKit",
      version: "0.1.0",
    },
  });
  return _stripe;
}
