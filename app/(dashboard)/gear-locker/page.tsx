import { GearLockerList } from "@/components/features/gear-locker-list";
import { AddGearDialog } from "@/components/features/add-gear-dialog";

export default function GearLockerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gear Locker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track what you own, what you want, and what you&apos;ve retired. The Advisor reads this so it doesn&apos;t suggest gear you already have.
          </p>
        </div>
        <AddGearDialog />
      </div>

      <GearLockerList />
    </div>
  );
}
