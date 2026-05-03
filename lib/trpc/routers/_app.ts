import { router, publicProcedure } from "../server";
import { gearLockerRouter } from "./gear-locker";
import { waitlistRouter } from "./waitlist";
import { productsRouter } from "./products";
import { billingRouter } from "./billing";

/**
 * Root tRPC router. Add new sub-routers here as features land.
 */
export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, ts: new Date() })),
  gearLocker: gearLockerRouter,
  waitlist: waitlistRouter,
  products: productsRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
