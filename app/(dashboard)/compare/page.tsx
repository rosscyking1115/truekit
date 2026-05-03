import { Suspense } from "react";
import { CompareView } from "@/components/features/compare-view";

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick two products. See the specs that matter, no affiliate spin.
        </p>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <CompareView />
      </Suspense>
    </div>
  );
}
