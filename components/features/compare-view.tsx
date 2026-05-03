"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";
import { Card } from "@/components/ui/card";
import {
  BOOT_SPEC_ROWS,
  bootCardSummary,
  formatPrice,
  formatWeight,
  type BootSpecs,
  type SpecRow,
} from "@/lib/product-display";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, ArrowLeftRight } from "lucide-react";

/**
 * Compare two products side-by-side.
 *
 * State lives in the URL (`?a=slug&b=slug`) so comparisons are shareable,
 * bookmarkable, and survive a refresh. Picker uses native <select> + <optgroup>
 * which is accessible by default and fine at this catalog size (28 items).
 *
 * Layout: 3-column table.
 *   col 1 = spec label   (left, narrow)
 *   col 2 = product A    (centre/grow)
 *   col 3 = product B    (centre/grow)
 *
 * Diff highlighting: when both sides have a value and they differ, both
 * value cells get the primary tint. Numeric diffs (e.g. weight) get a small
 * "Xg lighter" annotation on the better side. Price gets "£X cheaper".
 */
export function CompareView() {
  const router = useRouter();
  const params = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");

  const products = trpc.products.list.useQuery({ limit: 200 });

  const update = (key: "a" | "b", slug: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (slug) next.set(key, slug);
    else next.delete(key);
    router.replace(`/compare?${next.toString()}`, { scroll: false });
  };

  const swap = () => {
    if (!a && !b) return;
    const next = new URLSearchParams(params.toString());
    if (a) next.set("b", a);
    else next.delete("b");
    if (b) next.set("a", b);
    else next.delete("a");
    router.replace(`/compare?${next.toString()}`, { scroll: false });
  };

  const productA = useMemo(
    () => products.data?.find((p) => p.slug === a) ?? null,
    [products.data, a]
  );
  const productB = useMemo(
    () => products.data?.find((p) => p.slug === b) ?? null,
    [products.data, b]
  );

  return (
    <div className="space-y-6">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <ProductPicker
          label="Product A"
          value={a}
          loading={products.isPending}
          options={products.data ?? []}
          excludeSlug={b}
          onChange={(slug) => update("a", slug)}
        />
        <button
          type="button"
          onClick={swap}
          aria-label="Swap A and B"
          disabled={!a && !b}
          className="hidden h-9 items-center justify-center rounded-md border bg-card px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 sm:inline-flex"
        >
          <ArrowLeftRight className="size-4" />
        </button>
        <ProductPicker
          label="Product B"
          value={b}
          loading={products.isPending}
          options={products.data ?? []}
          excludeSlug={a}
          onChange={(slug) => update("b", slug)}
        />
      </div>

      {!productA && !productB ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          Pick two boots above to see them side by side.
        </div>
      ) : (
        <CompareTable a={productA} b={productB} />
      )}
    </div>
  );
}

type Product = RouterOutputs["products"]["list"][number];

function ProductPicker({
  label,
  value,
  loading,
  options,
  excludeSlug,
  onChange,
}: {
  label: string;
  value: string | null;
  loading: boolean;
  options: Product[];
  excludeSlug: string | null;
  onChange: (slug: string | null) => void;
}) {
  const byBrand = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of options) {
      if (p.slug === excludeSlug) continue;
      const list = map.get(p.brand) ?? [];
      list.push(p);
      map.set(p.brand, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [options, excludeSlug]);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <div className="relative">
        <select
          value={value ?? ""}
          disabled={loading}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-9 w-full appearance-none rounded-md border border-input bg-card px-3 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">{loading ? "Loading…" : "Select a product"}</option>
          {byBrand.map(([brand, items]) => (
            <optgroup key={brand} label={brand}>
              {items.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {loading && (
          <Loader2 className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
    </label>
  );
}

function CompareTable({ a, b }: { a: Product | null; b: Product | null }) {
  const sa = (a?.specs ?? null) as BootSpecs | null;
  const sb = (b?.specs ?? null) as BootSpecs | null;

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-44" />
          <col />
          <col />
        </colgroup>

        <thead>
          <tr className="border-b bg-secondary/30 align-top">
            <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Spec
            </th>
            <ProductHeaderCell product={a} />
            <ProductHeaderCell product={b} />
          </tr>
        </thead>

        <tbody>
          <PriceRow a={a} b={b} />
          {BOOT_SPEC_ROWS.map((row) => (
            <SpecRowDisplay key={row.key} row={row} sa={sa} sb={sb} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ProductHeaderCell({ product }: { product: Product | null }) {
  if (!product) {
    return (
      <th className="px-4 py-4 text-left align-top">
        <span className="text-sm font-normal text-muted-foreground">
          Pick a product above
        </span>
      </th>
    );
  }
  const specs = (product.specs ?? null) as BootSpecs | null;
  return (
    <th className="px-4 py-4 text-left align-top font-normal">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {product.brand}
      </p>
      <h2 className="mt-0.5 text-base font-semibold leading-tight">{product.name}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{bootCardSummary(specs)}</p>
      {specs?.url && (
        <a
          href={specs.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Source <ExternalLink className="size-3" />
        </a>
      )}
    </th>
  );
}

function PriceRow({ a, b }: { a: Product | null; b: Product | null }) {
  const va = a?.msrp ?? null;
  const vb = b?.msrp ?? null;
  const both = va != null && vb != null;
  const differ = both && va !== vb;
  const cheaper: "a" | "b" | null = both
    ? va < vb
      ? "a"
      : va > vb
        ? "b"
        : null
    : null;

  return (
    <tr className="border-b align-top">
      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
      <ValueCell highlight={differ}>
        <span>{formatPrice(va)}</span>
        {cheaper === "a" && both && (
          <span className="text-xs text-primary">
            £{((vb! - va!) / 100).toFixed(0)} cheaper
          </span>
        )}
      </ValueCell>
      <ValueCell highlight={differ}>
        <span>{formatPrice(vb)}</span>
        {cheaper === "b" && both && (
          <span className="text-xs text-primary">
            £{((va! - vb!) / 100).toFixed(0)} cheaper
          </span>
        )}
      </ValueCell>
    </tr>
  );
}

function SpecRowDisplay({
  row,
  sa,
  sb,
}: {
  row: SpecRow;
  sa: BootSpecs | null;
  sb: BootSpecs | null;
}) {
  const va = row.value(sa);
  const vb = row.value(sb);
  const both = va != null && vb != null;
  const differ = both && va !== vb;

  let annotation: { side: "a" | "b"; text: string } | null = null;
  if (row.numeric) {
    const na = row.numeric(sa);
    const nb = row.numeric(sb);
    if (na != null && nb != null && na !== nb) {
      const lower = na < nb ? "a" : "b";
      const diff = Math.abs(na - nb);
      const text =
        row.key === "weight" ? `${formatWeight(diff)} lighter` : `${diff} less`;
      if (row.lowerIsBetter) annotation = { side: lower, text };
    }
  }

  return (
    <tr className="border-b align-top last:border-b-0">
      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
        {row.label}
      </th>
      <ValueCell highlight={differ} muted={va == null}>
        <span>{va ?? "—"}</span>
        {annotation?.side === "a" && (
          <span className="text-xs text-primary">{annotation.text}</span>
        )}
      </ValueCell>
      <ValueCell highlight={differ} muted={vb == null}>
        <span>{vb ?? "—"}</span>
        {annotation?.side === "b" && (
          <span className="text-xs text-primary">{annotation.text}</span>
        )}
      </ValueCell>
    </tr>
  );
}

function ValueCell({
  highlight,
  muted,
  children,
}: {
  highlight?: boolean;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        highlight && "bg-primary/5 font-medium text-foreground",
        muted && "text-muted-foreground"
      )}
    >
      <div className="flex flex-col gap-0.5">{children}</div>
    </td>
  );
}
