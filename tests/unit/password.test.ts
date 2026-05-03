import { describe, it, expect } from "vitest";
import {
  PASSWORD_RULES,
  validatePassword,
  PASSWORD_SPECIAL_CHARS,
} from "@/lib/password";

/**
 * Each rule exists for a real reason. The tests document what each rule
 * accepts and rejects so future tweaks (or accidental regressions) get
 * caught at CI time.
 */
describe("validatePassword", () => {
  it("rejects empty string", () => {
    const r = validatePassword("");
    expect(r.ok).toBe(false);
    expect(r.failed.length).toBe(PASSWORD_RULES.length);
  });

  it("rejects under 8 characters", () => {
    const r = validatePassword("Ab1!");
    expect(r.ok).toBe(false);
    expect(r.failed.some((f) => f.id === "length")).toBe(true);
  });

  it("rejects all-letter passwords", () => {
    const r = validatePassword("Password!!!"); // no digits
    expect(r.ok).toBe(false);
    expect(r.failed.some((f) => f.id === "mix")).toBe(true);
  });

  it("rejects all-digit passwords", () => {
    const r = validatePassword("12345678!"); // no letters
    expect(r.ok).toBe(false);
    expect(r.failed.some((f) => f.id === "mix")).toBe(true);
  });

  it("rejects passwords with no uppercase", () => {
    const r = validatePassword("password1!");
    expect(r.ok).toBe(false);
    expect(r.failed.some((f) => f.id === "uppercase")).toBe(true);
  });

  it("rejects passwords with no special character", () => {
    const r = validatePassword("Password123");
    expect(r.ok).toBe(false);
    expect(r.failed.some((f) => f.id === "special")).toBe(true);
  });

  it("accepts a password meeting every rule", () => {
    const r = validatePassword("Password1!");
    expect(r.ok).toBe(true);
    expect(r.failed.length).toBe(0);
  });

  it("accepts every special character in the allowlist individually", () => {
    for (const ch of PASSWORD_SPECIAL_CHARS) {
      const r = validatePassword(`Password1${ch}`);
      expect(r.ok, `expected '${ch}' to satisfy the special-char rule`).toBe(true);
    }
  });

  it("rejects whitespace as a special character", () => {
    const r = validatePassword("Password1 "); // space
    expect(r.failed.some((f) => f.id === "special")).toBe(true);
  });
});
