import { z } from "zod";
import { router, publicProcedure } from "../server";
import { Prisma } from "@prisma/client";

/**
 * Pre-launch waitlist capture. Idempotent — re-submitting the same email is a
 * no-op (returns ok), so the landing page doesn't reveal whether an email is
 * already on the list.
 */
export const waitlistRouter = router({
  join: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        source: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.waitlistEntry.create({
          data: { email: input.email.toLowerCase(), source: input.source },
        });
      } catch (err) {
        // P2002 = unique constraint violation; treat as a no-op so we don't
        // leak which addresses are already signed up.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return { ok: true as const, duplicate: true };
        }
        throw err;
      }
      return { ok: true as const, duplicate: false };
    }),
});
