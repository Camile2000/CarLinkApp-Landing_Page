// Schémas Zod partagés — valider toute entrée externe avant traitement.
// Utilisés côté web (Server Actions, API routes) et mobile (hooks de formulaire).
// IMPORTANT : zod doit être installé : npm install zod --workspace packages/shared

import { z } from 'zod';

// ── Primitives ────────────────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid();
export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Numéro de téléphone invalide');
export const emailSchema = z.string().email('Email invalide');

// ── Auth ─────────────────────────────────────────────────────────────────────

export const signUpSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  full_name: z.string().min(2).max(100),
  role: z.enum(['conductor', 'garage']),
  city: z.string().max(100).optional(),
  language: z.enum(['fr', 'en']).default('fr'),
});

// ── Vehicle ──────────────────────────────────────────────────────────────────

export const vehicleSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1960).max(new Date().getFullYear() + 1).optional(),
  license_plate: z.string().max(20).optional(),
  mileage: z.number().int().min(0).max(9_999_999).optional(),
  fuel_type: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
});

// ── Quote Request ─────────────────────────────────────────────────────────────

export const quoteRequestSchema = z.object({
  vehicle_id: uuidSchema,
  garage_id: uuidSchema.optional(),
  service_type: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  images_urls: z.array(z.string().url()).max(10).default([]),
});

// ── Quote ─────────────────────────────────────────────────────────────────────

export const quoteSchema = z.object({
  request_id: uuidSchema,
  diagnostic_price: z.number().min(0).max(10_000_000),
  parts_price: z.number().min(0).max(10_000_000),
  labor_price: z.number().min(0).max(10_000_000),
  estimated_days: z.number().int().min(0).max(365).optional(),
  warranty: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

// ── Message ───────────────────────────────────────────────────────────────────

export const messageSchema = z.object({
  request_id: uuidSchema,
  recipient_id: uuidSchema,
  content: z.string().min(1).max(5000).optional(),
  images_urls: z.array(z.string().url()).max(5).default([]),
});

// ── Review ────────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  request_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  quality_rating: z.number().int().min(1).max(5).optional(),
  transparency_rating: z.number().int().min(1).max(5).optional(),
  timing_rating: z.number().int().min(1).max(5).optional(),
  communication_rating: z.number().int().min(1).max(5).optional(),
  price_rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
});

// ── Garage profile update ─────────────────────────────────────────────────────

export const garageUpdateSchema = z.object({
  garage_name: z.string().min(2).max(200),
  city: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  phone: phoneSchema.optional(),
  specialties: z.array(z.string().max(100)).max(20).default([]),
});

// ── Types inférés (utilisables directement dans le code) ─────────────────────

export type SignUpInput = z.infer<typeof signUpSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type GarageUpdateInput = z.infer<typeof garageUpdateSchema>;
