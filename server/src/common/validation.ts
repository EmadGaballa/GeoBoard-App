// ======================================================
// GEOBOARD — INPUT VALIDATION (Zod Schemas)
// ======================================================

import { z } from 'zod'

// ── Auth ───────────────────────────────────────────────
export const emailLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
})

// ── Location ───────────────────────────────────────────
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(['gps', 'ip', 'manual', 'map']),
  city: z.string().optional(),
  country: z.string().optional(),
})

export const saveLocationSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().optional(),
})

// ── Weather ────────────────────────────────────────────
export const weatherQuerySchema = z.object({
  lat: z.string().optional(),
  lng: z.string().optional(),
  city: z.string().optional(),
})

// ── News ───────────────────────────────────────────────
export const newsQuerySchema = z.object({
  category: z.string().default('technology'),
  pageSize: z.string().optional(),
})

// ── Currency ───────────────────────────────────────────
export const currencyQuerySchema = z.object({
  base: z.string().default('USD'),
})

export const currencyConvertSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  amount: z.number().positive(),
})

// ── Dashboard ──────────────────────────────────────────
export const dashboardConfigSchema = z.object({
  widgets: z.array(z.string()).optional(),
  layout: z.string().optional(),
  defaultLocation: z.string().optional(),
  preferences: z.object({
    temperatureUnit: z.enum(['celsius', 'fahrenheit']).optional(),
    newsCategories: z.array(z.string()).optional(),
    currencyBase: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    theme: z.string().optional(),
  }).optional(),
})