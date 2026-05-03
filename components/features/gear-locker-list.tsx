"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, ExternalLink } from "lucide-react";
import { bootCardSummary, formatPrice, type BootSpecs } from "@/lib/product-display";
import type { GearStatus } from "@prisma/client";
import { useState } from "react";

/**
 * Reads the user's locker via tRPC, groups by status, renders cards with key
 * specs + remove. Empty states per section give the user something to do.
 */

const STATUS_ORDER: GearStatus[] = ["OWNED", "WISHLIST", "RETIRED"];
const STATUS_COPY: Record<GearStatus, { title: string; empty: string }> = {
  OWNED: {
    title: "Owned",
    empty:
      "Add the boots you actually own — the Advisor will use this to fill gaps instead of suggesting things you already have.",
  },
  WISHLIST: {
    title: "Wishlist",
    empty: "Saving boots for later? Add them here.",
  },
  RETIRED: {
    title: "Retired",
    empty: "Worn out? Move boots here for personal records.",
  },
};

export function GearLockerList() {
  const list = trpc.gearLocker.list.useQuery();

  if (list.isPending) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (list.error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Couldn&apos;t load your locker: {list.error.message}
      </div>
    );
  }

  const items = list.data ?? [];
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: items.filter((i) => i.status === status),
  }));

  return (
    <div className="space-y-8">
      {grouped.map(({ status, items }) => (
        <section key={status}>
          <header className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {STATUS_COPY[status].title}
            </h2>
            <Badge variant="muted">{items.length}</Badge>
          </header>
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/20 px-6 py-8 text-center text-sm text-muted-foreground">
              {STATUS_COPY[status].empty}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <GearItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

type Item = RouterOutputs["gearLocker"]["list"][number];

function GearItemCard({ item }: { item: Item }) {
  const utils = trpc.useUtils();
  const [pendingRemove, setPendingRemove] = useState(false);
  const remove = trpc.gearLocker.remove.useMutation({
    onMutate: () => setPendingRemove(true),
    onSettled: () => {
      setPendingRemove(false);
      utils.gearLocker.list.invalidate();
    },
  });

  const specs = (item.product.specs ?? null) as BootSpecs | null;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {item.product.brand}
          </p>
          <h3 className="truncate font-medium leading-tight">{item.product.name}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Remove from locker"
          disabled={pendingRemove}
          onClick={() => remove.mutate({ id: item.id })}
          className="-mr-2 -mt-1 text-muted-foreground hover:text-destructive"
        >
          {pendingRemove ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{bootCardSummary(specs)}</p>

      <div className="mt-auto flex items-center justify-between text-xs">
        <span className="font-medium">{formatPrice(item.product.msrp)}</span>
        {specs?.url && (
          <a
            href={specs.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Source <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {item.notes && (
        <p className="border-t border-border/50 pt-3 text-xs italic text-muted-foreground">
          {item.notes}
        </p>
      )}
    </Card>
  );
}
