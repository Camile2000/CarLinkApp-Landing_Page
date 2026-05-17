// Types TypeScript du schéma CarLink — partagés mobile ↔ web.
// À garder synchronisés avec supabase/schema.sql.

export type UserRole = 'driver' | 'garage_owner' | 'admin';
export type GarageStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type RequestStatus =
  | 'open'
  | 'quoted'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type NotificationType =
  | 'quote_received'
  | 'quote_accepted'
  | 'new_message'
  | 'request_update'
  | 'garage_approved'
  | 'review_received';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number | null;
  license_plate: string | null;
  vin: string | null;
  mileage: number | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Garage {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  logo_url: string | null;
  services: string[];
  status: GarageStatus;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: RequestStatus;
  latitude: number | null;
  longitude: number | null;
  preferred_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  request_id: string;
  garage_id: string;
  amount: number;
  currency: string;
  estimated_duration: string | null;
  message: string | null;
  status: QuoteStatus;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  request_id: string;
  driver_id: string;
  garage_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  garage_id: string;
  driver_id: string;
  request_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
