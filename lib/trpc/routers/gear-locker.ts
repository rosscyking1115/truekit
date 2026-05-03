import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { GearStatus, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Gear Locker — the user's inventory of owned/wanted/retired gear.
 * Phase 1: list, add, remove. Comparisons + AI gap analysis come later.
 */
export const gearLockerRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.gearItem.findMany({
      where: { userId: ctx.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    })
  ),

  add: protectedProcedure
    .input(
      z.object({
        productId: z.string().min(1),
        status: z.nativeEnum(GearStatus).default(GearStatus.OWNED),
        purchasedAt: z.coerce.date().optional(),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.gearItem.create({
          data: {
            userId: ctx.user.id,
            productId: input.productId,
            status: input.status,
            purchasedAt: input.purchasedAt,
            notes: input.notes,
          },
        });
      } catch (err) {
        // P2002 = unique constraint (userId, productId, status). User already
        // has this exact combination — surface a clean message.
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You've already added this product with that status.",
          });
        }
        throw err;
      }
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Defensive: only allow deletion of items the caller owns.
      const item = await ctx.db.gearItem.findUnique({ where: { id: input.id } });
      if (!item || item.userId !== ctx.user.id) {
        return { ok: false as const };
      }
      await ctx.db.gearItem.delete({ where: { id: input.id } });
      return { ok: true as const };
    }),
});
