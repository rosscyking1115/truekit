import { describe, it, expect } from "vitest";
import { tierFromSubscription, isProActive } from "@/lib/subscription";
import type { Subscription } from "@prisma/client";

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub_test",
    userId: "user_test",
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: "sub_stripe",
    stripePriceId: "price_test",
    status: "active",
    currentPeriodEnd: new Date("2030-01-01"),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("tierFromSubscription", () => {
  it("returns free when no row exists", () => {
    expect(tierFromSubscription(null)).toBe("free");
    expect(tierFromSubscription(undefined)).toBe("free");
  });

  it("returns pro for active subs", () => {
    expect(tierFromSubscription(sub({ status: "active" }))).toBe("pro");
  });

  it("returns pro for trialing subs (free trial period still counts)", () => {
    expect(tierFromSubscription(sub({ status: "trialing" }))).toBe("pro");
  });

  it("returns pro for cancel-at-period-end (still active until end of period)", () => {
    expect(
      tierFromSubscription(sub({ status: "active", cancelAtPeriodEnd: true }))
    ).toBe("pro");
  });

  it("returns free for canceled subs", () => {
    expect(tierFromSubscription(sub({ status: "canceled" }))).toBe("free");
  });

  it("returns free for past_due subs (no grace period — they fix or lose access)", () => {
    expect(tierFromSubscription(sub({ status: "past_due" }))).toBe("free");
  });

  it("returns free for incomplete subs", () => {
    expect(tierFromSubscription(sub({ status: "incomplete" }))).toBe("free");
  });
});

describe("isProActive", () => {
  it("delegates to tierFromSubscription", () => {
    expect(isProActive(sub({ status: "active" }))).toBe(true);
    expect(isProActive(sub({ status: "canceled" }))).toBe(false);
    expect(isProActive(null)).toBe(false);
  });
});
