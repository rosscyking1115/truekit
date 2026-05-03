import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatWeight,
  bootCardSummary,
  BOOT_SPEC_ROWS,
  type BootSpecs,
} from "@/lib/product-display";

describe("formatPrice", () => {
  it("renders pence as £ with no decimals when whole pounds", () => {
    expect(formatPrice(20000)).toBe("£200");
    expect(formatPrice(0)).toBe("£0");
  });

  it("renders fractional pounds with two decimals", () => {
    expect(formatPrice(19999)).toBe("£199.99");
    expect(formatPrice(150)).toBe("£1.50");
  });

  it("renders em-dash for missing prices", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(undefined)).toBe("—");
  });
});

describe("formatWeight", () => {
  it("uses grams under 1kg", () => {
    expect(formatWeight(345)).toBe("345 g");
  });

  it("uses kg with up to 2 decimals at 1000g+", () => {
    expect(formatWeight(1340)).toBe("1.34 kg");
    expect(formatWeight(2000)).toBe("2 kg");
  });

  it("renders em-dash for missing weights", () => {
    expect(formatWeight(null)).toBe("—");
  });
});

describe("bootCardSummary", () => {
  it("composes the standard locker card summary", () => {
    const specs: BootSpecs = {
      cut: "mid",
      hanwag_class: "B",
      waterproofing: "GORE-TEX",
      weight_g_pair: 1340,
    };
    expect(bootCardSummary(specs)).toBe("Mid · Class B · Gore-Tex · 1340g pair");
  });

  it("omits missing fields gracefully", () => {
    expect(bootCardSummary({ cut: "low" })).toBe("Low");
    expect(bootCardSummary(null)).toBe("");
  });

  it("normalises waterproofing brand names", () => {
    expect(bootCardSummary({ waterproofing: "Powertex (PFC-Free)" })).toBe(
      "Powertex"
    );
    expect(bootCardSummary({ waterproofing: "OutDry™ Extreme" })).toBe("OutDry");
  });
});

describe("BOOT_SPEC_ROWS", () => {
  it("flags weight as lower-is-better", () => {
    const weightRow = BOOT_SPEC_ROWS.find((r) => r.key === "weight");
    expect(weightRow?.lowerIsBetter).toBe(true);
  });

  it("price is intentionally not in the spec rows (it's rendered separately)", () => {
    expect(BOOT_SPEC_ROWS.some((r) => r.key === "price")).toBe(false);
  });
});
