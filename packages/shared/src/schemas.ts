import { z } from 'zod';

// Format téléphone international Afrique de l'Ouest (+225, +237, +221…)
const phoneRegex = /^\+[1-9][0-9]{8,14}$/;

export const LoginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Format invalide. Ex: +22507XXXXXXXX'),
});

export const OtpSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Téléphone invalide'),
  token: z.string().length(6, 'Le code doit comporter 6 chiffres').regex(/^[0-9]+$/, 'Chiffres uniquement'),
});

export const ProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Minimum 2 caractères').max(100, 'Maximum 100 caractères'),
  city: z.string().trim().min(2, 'Minimum 2 caractères').max(100).optional(),
  language: z.enum(['fr', 'en']).default('fr'),
});

export const GarageSetupSchema = z.object({
  garage_name: z.string().trim().min(2, 'Minimum 2 caractères').max(100, 'Maximum 100 caractères'),
  city: z.string().trim().min(2, 'Minimum 2 caractères').max(100),
  neighborhood: z.string().trim().max(100).optional(),
  phone: z.string().trim().regex(phoneRegex, 'Format invalide').optional().or(z.literal('')),
  specialties: z.array(z.string()).default([]),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type OtpInput = z.infer<typeof OtpSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type GarageSetupInput = z.infer<typeof GarageSetupSchema>;
