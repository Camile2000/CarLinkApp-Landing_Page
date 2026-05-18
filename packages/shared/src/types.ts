// Types TypeScript du schéma CarLink — partagés mobile ↔ web.
// À garder synchronisés avec supabase/schema.sql.

export type UserRole = 'conductor' | 'garage' | 'admin';
export type AppLanguage = 'fr' | 'en';
export type RequestUrgency = 'low' | 'medium' | 'high';
export type RequestStatus =
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'declined';
export type PaymentStatus = 'pending' | 'paid';

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  city: string | null;
  language: AppLanguage;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number | null;
  license_plate: string | null;
  mileage: number | null;
  fuel_type: string | null;
  color: string | null;
  created_at: string;
}

export interface Garage {
  id: string;
  user_id: string;
  garage_name: string;
  city: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  specialties: string[];
  rating: number;
  review_count: number;
  is_certified: boolean;
  suspended: boolean;
  documents_verified: boolean;
  response_time_avg: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteRequest {
  id: string;
  conductor_id: string;
  garage_id: string | null;
  vehicle_id: string | null;
  service_type: string;
  description: string | null;
  images_urls: string[];
  urgency: RequestUrgency;
  status: RequestStatus;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export interface Quote {
  id: string;
  request_id: string;
  garage_id: string;
  diagnostic_price: number;
  parts_price: number;
  labor_price: number;
  total_price: number;
  estimated_days: number | null;
  warranty: string | null;
  notes: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  images_urls: string[];
  read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  request_id: string;
  garage_id: string;
  conductor_id: string;
  rating: number;
  quality_rating: number | null;
  transparency_rating: number | null;
  timing_rating: number | null;
  communication_rating: number | null;
  price_rating: number | null;
  comment: string | null;
  approved: boolean;
  flagged: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  request_id: string;
  garage_id: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_date: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}
