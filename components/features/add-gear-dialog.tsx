"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GearStatus } from "@prisma/client";

/**
 * Add Gear flow.
 *
 * Trigger button → modal containing:
 *   - filter-as-you-type product list (works fine for the current 28-product
 *     catalog; swap to async server search when the catalog grows)
 *   - status picker (Owned / Wishlist / Retired)
 *   - optional notes
 *
 * On success: invalidate the locker list query and close.
 */
const STATUS_OPTIONS: { value: GearStatus; label: string; hint: string }[] = [
  { value: "OWNED", label: "Owned", hint: "Already in my kit" },
  { value: "WISHLIST", label: "Wishlist", hint: "Considering buying" },
  { value: "RETIRED", label: "Retired", hint: "Worn out / sold" },
];

export function AddGearDialog() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [status, setStatus] = useState<GearStatus>("OWNED");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const products = trpc.products.list.useQuery({ limit: 200 }, { enabled: open });
  const add = trpc.gearLocker.add.useMutation({
    onSuccess: () => {
      utils.gearLocker.list.invalidate();
      setOpen(false);
      // reset for next open
      setFilter("");
      setProductId(null);
      setStatus("OWNED");
      setNotes("");
    },
  });

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const all = products.data ?? [];
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [products.data, filter]);

  const selected = filtered.find((p) => p.id === productId) ?? null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add gear
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add to your Gear Locker</DialogTitle>
          <DialogDescription>
            Pick a product, set its status, and optionally jot a note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product picker */}
          <div className="space-y-2">
            <Label htmlFor="product-search">Product</Label>
            <Input
              id="product-search"
              placeholder="Search by brand or model..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoComplete="off"
            />
            <div className="max-h-56 overflow-y-auto rounded-md border bg-card">
              {products.isPending ? (
                <div className="flex h-20 items-center justify-center text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No products match. Try a brand name like &quot;Salomon&quot;.
                </p>
              ) : (
                <ul role="listbox" className="divide-y">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={productId === p.id}
                        onClick={() => setProductId(p.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                          productId === p.id && "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                            {p.brand}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </span>
                        {p.msrp != null && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            £{(p.msrp / 100).toFixed(0)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent",
                    status === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-input bg-card text-muted-foreground"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <span className="text-xs">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Bought 2024, used in Lake District. Slight pinching on right toe."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>

          {add.error && (
            <p className="text-sm text-destructive" role="alert">
              {add.error.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={add.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={!selected || add.isPending}
            onClick={() => {
              if (!selected) return;
              add.mutate({
                productId: selected.id,
                status,
                notes: notes.trim() || undefined,
              });
            }}
          >
            {add.isPending ? <Loader2 className="size-4 animate-spin" /> : "Add to locker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
