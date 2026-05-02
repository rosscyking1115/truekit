import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

/**
 * tRPC server init — once per app.
 *
 * superjson lets us send Date/Map/Set/BigInt/etc. across the wire
 * without manual serialisation; the client transformer must match.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Open to anyone, signed in or not. */
export const publicProcedure = t.procedure;

/** Requires an authenticated Supabase user. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // narrow non-null
    },
  });
});
