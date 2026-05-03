/**
 * Password complexity rules for TrueKit signups.
 *
 * Why these specifically:
 *   - 8 char min: matches NIST guidance, low enough to not annoy users.
 *   - Uppercase: forces mixed-case to slow down dumb bots.
 *   - Letter + digit: prevents trivial all-letter ("password") or all-digit
 *     ("12345678") passwords.
 *   - One special from a fixed safe set: avoids whitespace / quote / backslash
 *     edge cases while still meeting the "must contain symbol" common rule.
 *
 * Defence-in-depth: also enable matching rules in the Supabase dashboard
 * (Authentication → Sign In / Providers → Email → Password requirements)
 * so the server rejects too-weak passwords even if the client check is bypassed.
 */

export const PASSWORD_SPECIAL_CHARS = "!@#$%^&*?";

export type PasswordRule = {
  id: string;
  label: string;
  test: (pw: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  },
  {
    id: "uppercase",
    label: "Contains an uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "mix",
    label: "Mixes letters and numbers",
    test: (pw) => /[A-Za-z]/.test(pw) && /\d/.test(pw),
  },
  {
    id: "special",
    label: `Contains a special character (${PASSWORD_SPECIAL_CHARS.split("").join(" ")})`,
    test: (pw) => new RegExp(`[${PASSWORD_SPECIAL_CHARS.replace(/[\^\-\]]/g, "\\$&")}]`).test(pw),
  },
];

export function validatePassword(pw: string): { ok: boolean; failed: PasswordRule[] } {
  const failed = PASSWORD_RULES.filter((r) => !r.test(pw));
  return { ok: failed.length === 0, failed };
}
