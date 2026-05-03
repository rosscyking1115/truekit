import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./routers/_app";

/**
 * Convenience aliases for tRPC procedure inputs/outputs.
 *
 * Use these instead of `ReturnType<typeof trpc.X.useQuery>["data"]` — that
 * pattern doesn't infer correctly under tRPC v11's procedure proxy.
 *
 *   type Items = RouterOutputs["gearLocker"]["list"];   // Item[]
 *   type Item  = Items[number];                          // single Item
 */
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
