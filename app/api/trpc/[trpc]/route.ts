import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/routers/_app";
import { createContext } from "@/lib/trpc/context";

/**
 * tRPC HTTP entrypoint. App Router catches all /api/trpc/* and forwards to
 * the fetch adapter. Context is built per request (Supabase auth + Prisma).
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[tRPC] error on '${path ?? "<no-path>"}':`, error);
      }
    },
  });

export { handler as GET, handler as POST };
