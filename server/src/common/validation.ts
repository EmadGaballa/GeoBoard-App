// ======================================================
// GEOBOARD — INPUT VALIDATION (Zod Schemas)
// ======================================================

import { z } from "zod";
import commonPassword from "common-password-checker";

// ── Shared primitives ──────────────────────────────────

// Username: 3-20 chars, letters/numbers/underscores only, no spaces.
// Uniqueness is enforced at the DB layer (service checks before insert).
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

// Email: standard format check + length cap. Zod lowercases nothing on its
// own, so we normalize to lowercase here since uniqueness should be
// case-insensitive (Aa@x.com and aa@x.com are the same account).
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(254, "Email cannot exceed 254 characters");

// Password policy:
//  - 8-12+ chars minimum (we require >= 10 as a middle ground; max 128 to
//    avoid pathological bcrypt input sizes)
//  - at least 1 uppercase, 1 lowercase, 1 number, 1 special character
//  - rejected if it appears on a list of commonly-leaked passwords
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  )
  .refine(
    (pw) => !commonPassword(pw),
    "This password is too common. Please choose something less guessable."
  );

// ── Gibberish / spam detection helpers ─────────────────
// These reject obvious keyboard mashing without blocking
// legitimate multi-lingual names.

/** Check if a name is mostly repeating single characters (e.g. "aaaaaa"). */
function isMostlyRepeatingChar(name: string): boolean {
  if (name.length < 4) return false
  const cleaned = name.replace(/\s/g, '')
  if (cleaned.length === 0) return false
  // Count most frequent character
  const freq: Record<string, number> = {}
  for (const ch of cleaned.toLowerCase()) {
    freq[ch] = (freq[ch] || 0) + 1
  }
  const maxFreq = Math.max(...Object.values(freq))
  // If a single character makes up >70% of the non-space chars, reject
  return maxFreq / cleaned.length > 0.7
}

/** Check for keyboard walks like "asdf", "qwerty", "zxcvb" */
function hasKeyboardWalk(name: string): boolean {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
  const cleaned = name.toLowerCase().replace(/\s/g, '')
  if (cleaned.length < 4) return false
  
  for (let i = 0; i <= cleaned.length - 4; i++) {
    const segment = cleaned.slice(i, i + 4)
    for (const row of rows) {
      if (row.includes(segment)) return true
    }
  }
  return false
}

/** Check for obvious gibberish patterns */
function isGibberish(name: string): boolean {
  if (name.length < 4) return false
  const cleaned = name.replace(/\s/g, '')
  
  // Reject if too many sequential identical characters (e.g. "jjjj", "nnnn")
  if (/(.)\1{3,}/.test(cleaned)) return true
  
  // Reject if mostly non-alphabetic characters — use a Unicode-aware approach.
  // Count characters that are letters in any script using regex.
  const alphaCount = Array.from(cleaned).filter((ch) => /\p{L}/u.test(ch)).length
  if (alphaCount / cleaned.length < 0.5 && cleaned.length >= 4) return true
  
  return false
}

// Display name: blocking obvious gibberish while allowing
// legitimate multi-lingual names.
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name cannot exceed 100 characters")
  .refine((name) => {
    // Must contain at least 2 alphabetic characters (for single-letter names with a space, etc.)
    // Use Unicode property escape to support all languages
    const alphaChars = Array.from(name).filter((ch) => /\p{L}/u.test(ch)).length
    return alphaChars >= 2
  }, "Name must contain at least 2 letters")
  .refine((name) => !isMostlyRepeatingChar(name), "This doesn't look like a real name")
  .refine((name) => !hasKeyboardWalk(name), "This doesn't look like a real name")
  .refine((name) => !isGibberish(name), "This doesn't look like a real name");

// ── Auth ───────────────────────────────────────────────
export const emailLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  name: displayNameSchema.optional(),

  avatarId: z
    .enum([
      "fox",
      "owl",
      "cat",
      "panda",
      "bunny",
      "koala",
      "hexagon",
      "triangle",
      "diamond",
      "orbit",
      "wave",
      "prism",
      "saturn",
      "rocket",
      "moon",
      "comet",
      "galaxy",
      "planet",
    ])
    .optional()
    .default("fox"),
});

export const updateProfileSchema = z.object({
  name: displayNameSchema.optional(),
  avatar: z.string().max(50).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const validateResetTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ── Location ───────────────────────────────────────────
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(["gps", "ip", "manual", "map"]),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const saveLocationSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().optional(),
});

// ── Weather ────────────────────────────────────────────
export const weatherQuerySchema = z.object({
  lat: z
    .string({ required_error: "lat query parameter is required" })
    .refine((val) => !isNaN(parseFloat(val)), "lat must be a valid number"),
  lng: z
    .string({ required_error: "lng query parameter is required" })
    .refine((val) => !isNaN(parseFloat(val)), "lng must be a valid number"),
  city: z.string().optional(),
});

// ── News ───────────────────────────────────────────────
export const newsQuerySchema = z.object({
  category: z.string().default("technology"),
  pageSize: z.string().optional(),
});

// ── Currency ───────────────────────────────────────────
export const currencyQuerySchema = z.object({
  base: z.string().default("USD"),
});

export const currencyConvertSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  amount: z.number().positive(),
});

// ── Dashboard ──────────────────────────────────────────
export const dashboardConfigSchema = z.object({
  widgets: z.array(z.string()).optional(),
  layout: z.string().optional(),
  defaultLocation: z.string().optional(),
  preferences: z
    .object({
      temperatureUnit: z.enum(["celsius", "fahrenheit"]).optional(),
      newsCategories: z.array(z.string()).optional(),
      currencyBase: z.string().optional(),
      timeFormat: z.enum(["12h", "24h"]).optional(),
      theme: z.string().optional(),
    })
    .optional(),
});