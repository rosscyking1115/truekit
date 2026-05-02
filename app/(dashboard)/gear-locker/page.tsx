export default function GearLockerPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gear Locker</h1>
        <p className="text-muted-foreground">
          Add the gear you own so the rest of TrueKit can be useful.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        Empty for now. Add-gear UI lands in the next pass — the data layer
        (<code>gearLocker.add/remove/list</code>) is already wired in tRPC.
      </div>
    </div>
  );
}
