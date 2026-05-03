import { z } from "zod";
import { router, publicProcedure } from "../server";
import { TRPCError } from "@trpc/server";

/**
 * Product catalog reads. All public — anyone (signed in or not) can browse.
 * Writes go through admin-only flows later (not a Phase 1 concern).
 */
export const productsRouter = router({
  /** All products in a category, alphabetised by brand → name. Used by Compare and the Gear Locker picker. */
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .optional()
    )
    .query(({ ctx, input }) =>
      ctx.db.product.findMany({
        where: input?.category ? { category: input.category } : undefined,
        take: input?.limit ?? 100,
        orderBy: [{ brand: "asc" }, { name: "asc" }],
      })
    ),

  /** Free-text search over name + brand. Cheap and case-insensitive; revisit with pgvector later. */
  search: publicProcedure
    .input(
      z.object({
        q: z.string().min(1).max(120),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(({ ctx, input }) =>
      ctx.db.product.findMany({
        where: {
          AND: [
            input.category ? { category: input.category } : {},
            {
              OR: [
                { name: { contains: input.q, mode: "insensitive" } },
                { brand: { contains: input.q, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: input.limit,
        orderBy: [{ brand: "asc" }, { name: "asc" }],
      })
    ),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({ where: { slug: input.slug } });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      return product;
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({ where: { id: input.id } });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      return product;
    }),

  /** All distinct categories present in the catalog. Used by the Compare picker dropdown. */
  categories: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.product.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category);
  }),
});
