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

export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .max(128, 'Maximum 128 caractères')
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre');

export const signUpWithPasswordSchema = signUpSchema.extend({
  password: passwordSchema,
});

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'Code OTP à 6 chiffres');

export const newPasswordSchema = z.object({
  password: passwordSchema,
  confirm: passwordSchema,
}).refine(
  (data) => data.password === data.confirm,
  {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  }
);

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
  address: z.string().max(200).optional(),
  phone: phoneSchema.optional(),
  specialties: z.array(z.string().max(100)).max(20).default([]),
});

// ── Garage sign-up (création du profil pro) ───────────────────────────────────

export const garageSignUpSchema = z.object({
  garage_name: z.string().min(2, 'Nom du garage requis').max(200),
  city: z.string().min(2, 'Ville requise').max(100),
  neighborhood: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  phone: phoneSchema,
  specialties: z
    .array(z.string().max(100))
    .min(1, 'Au moins une spécialité requise')
    .max(20),
});

// ── Conducteur sign-up complet (formulaire mobile) ────────────────────────────
// Conforme à la maquette Showcase v3 : Prénom + Nom + Email + Téléphone +
// Ville + Mot de passe. Le `full_name` est reconstruit côté client par
// concaténation (firstName + ' ' + lastName) avant l'appel à signUp.

export const conductorSignUpSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(50),
  last_name: z.string().min(1, 'Nom requis').max(50),
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().min(2, 'Ville requise').max(100),
  password: passwordSchema,
  language: z.enum(['fr', 'en']).default('fr'),
});

// ── Garagiste sign-up complet (formulaire mobile) ─────────────────────────────
// Conforme à la maquette Showcase v3 : tous les champs garage saisis au
// signup (plus de garage-setup intermédiaire). Le client crée d'abord le
// user via supabase.auth.signUp (avec role='garage' dans metadata), puis
// après vérification OTP insère la ligne dans public.garages.

export const garagistSignUpSchema = z.object({
  garage_name: z.string().min(2, 'Nom du garage requis').max(200),
  manager_name: z.string().min(2, 'Nom du gérant requis').max(100),
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().min(2, 'Ville requise').max(100),
  neighborhood: z.string().max(100).optional(),
  address: z.string().min(2, 'Adresse requise').max(200),
  specialties: z
    .array(z.string().max(100))
    .min(1, 'Au moins une spécialité requise')
    .max(20),
  password: passwordSchema,
  language: z.enum(['fr', 'en']).default('fr'),
});

// ── Document garagiste ────────────────────────────────────────────────────────

export const documentTypeSchema = z.enum([
  'id_card',
  'business_registry',
  'tax_certificate',
  'garage_photo',
  'other',
]);

export const garageDocumentSchema = z.object({
  garage_id: uuidSchema,
  doc_type: documentTypeSchema,
  file_path: z.string().min(1).max(500),
});

// ── Types inférés (utilisables directement dans le code) ─────────────────────

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpWithPasswordInput = z.infer<typeof signUpWithPasswordSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type GarageUpdateInput = z.infer<typeof garageUpdateSchema>;
export type GarageSignUpInput = z.infer<typeof garageSignUpSchema>;
export type GarageDocumentInput = z.infer<typeof garageDocumentSchema>;
export type ConductorSignUpInput = z.infer<typeof conductorSignUpSchema>;
export type GaragistSignUpInput = z.infer<typeof garagistSignUpSchema>;
