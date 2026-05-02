import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — the standard shadcn/ui class merge helper.
 * Combines clsx (conditional classes) with tailwind-merge (dedupes conflicting
 * Tailwind utilities, e.g. `px-2` + `px-4` → `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
