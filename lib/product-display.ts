/**
 * Helpers for rendering product cards. Kept dumb and shared so Gear Locker
 * cards, Compare cards, and (later) Search cards format the same.
 */

export type BootSpecs = {
  hanwag_class?: string;
  cut?: "low" | "mid" | "high" | string;
  weight_g_per_shoe?: number;
  weight_g_pair?: number;
  waterproofing?: string;
  upper?: string;
  outsole?: string;
  crampon_compat?: "B0" | "B1" | "B2" | "B3" | string;
  insulation?: string | null;
  url?: string;
  field_of_application?: string;
  terrain_use_case?: string;
  key_features?: string[];
};

export function formatPrice(pence: number | null | undefined): string {
  if (pence == null) return "—";
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}

export function formatWeight(grams: number | null | undefined): string {
  if (grams == null) return "—";
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} kg`;
  return `${grams} g`;
}

/** Compact one-line summary used on locker cards: "Mid · Class B · Gore-Tex · 1340g pair" */
export function bootCardSummary(specs: BootSpecs | null | undefined): string {
  if (!specs) return "";
  const bits: string[] = [];
  if (specs.cut) bits.push(specs.cut[0].toUpperCase() + specs.cut.slice(1));
  if (specs.hanwag_class) bits.push(`Class ${specs.hanwag_class}`);
  if (specs.waterproofing) {
    const wp = specs.waterproofing.toUpperCase();
    if (wp.includes("GORE-TEX")) bits.push("Gore-Tex");
    else if (wp.includes("POWERTEX")) bits.push("Powertex");
    else if (wp.includes("PROOF")) bits.push("Proof");
    else if (wp.includes("OUTDRY")) bits.push("OutDry");
    else bits.push(specs.waterproofing.split(/[\s(]/)[0]);
  }
  if (specs.weight_g_pair) bits.push(`${specs.weight_g_pair}g pair`);
  return bits.join(" · ");
}

/**
 * Structured spec rows used by the Compare table.
 * Each row knows how to render its label, the value for either side, and
 * (optionally) the diff comparison.
 */
export type SpecRow = {
  key: string;
  label: string;
  /** Value for one side, formatted as a string; null if missing. */
  value: (specs: BootSpecs | null | undefined) => string | null;
  /** Numeric value for diff math (lower-is-better assumed). Optional. */
  numeric?: (specs: BootSpecs | null | undefined) => number | null;
  /** Whether lower numeric = better (e.g. weight). Used for "X lighter" annotation. */
  lowerIsBetter?: boolean;
};

const HANWAG_CLASS_HINT: Record<string, string> = {
  A: "very flexible — leisure / urban",
  "A/B": "flexible to moderate — fast hiking",
  B: "moderate — demanding hikes / multi-day",
  "B/C": "moderate-stiff — alpine, occasional crampon",
  C: "stiff — via ferrata / B2 crampon",
  "C/D": "very stiff — alpine / step-in capable",
  D: "extremely stiff — high-alpine / full step-in",
};

const CRAMPON_HINT: Record<string, string> = {
  B0: "none",
  B1: "light/occasional",
  B2: "semi-automatic",
  B3: "step-in",
};

export const BOOT_SPEC_ROWS: SpecRow[] = [
  {
    key: "hanwag_class",
    label: "Stiffness (Hanwag class)",
    value: (s) => {
      if (!s?.hanwag_class) return null;
      const hint = HANWAG_CLASS_HINT[s.hanwag_class];
      return hint ? `${s.hanwag_class} — ${hint}` : s.hanwag_class;
    },
  },
  {
    key: "cut",
    label: "Cut",
    value: (s) => (s?.cut ? s.cut[0].toUpperCase() + s.cut.slice(1) : null),
  },
  {
    key: "weight",
    label: "Weight (pair)",
    value: (s) => formatWeight(s?.weight_g_pair),
    numeric: (s) => s?.weight_g_pair ?? null,
    lowerIsBetter: true,
  },
  {
    key: "waterproofing",
    label: "Waterproofing",
    value: (s) => s?.waterproofing ?? null,
  },
  {
    key: "upper",
    label: "Upper",
    value: (s) => s?.upper ?? null,
  },
  {
    key: "outsole",
    label: "Outsole",
    value: (s) => s?.outsole ?? null,
  },
  {
    key: "crampon",
    label: "Crampon",
    value: (s) => {
      if (!s?.crampon_compat) return null;
      const hint = CRAMPON_HINT[s.crampon_compat];
      return hint ? `${s.crampon_compat} — ${hint}` : s.crampon_compat;
    },
  },
  {
    key: "insulation",
    label: "Insulation",
    value: (s) => s?.insulation || "None",
  },
  {
    key: "field_of_application",
    label: "Intended use",
    value: (s) => s?.field_of_application ?? null,
  },
];
