// Types générés du schéma Supabase — partagés mobile ↔ web.
// À maintenir en sync avec supabase/schema.sql et supabase/migrations/

export type UserRole = 'conductor' | 'garage' | 'admin';
export type AppLanguage = 'fr' | 'en';
export type RequestUrgency = 'low' | 'medium' | 'high';
export type RequestStatus = 'pending' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'declined';
export type PaymentStatus = 'pending' | 'paid';
export type DocumentType = 'id_card' | 'business_registry' | 'tax_certificate' | 'garage_photo' | 'other';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';
export type CertificationAction = 'submitted' | 'approved' | 'rejected' | 'revoked';

// ---- public.users (table réelle, accès restreint) ----
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

// ---- public.user_profiles (vue sécurisée, colonnes non-sensibles) ----
export interface UserProfile {
  id: string;
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
  address: string | null;
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

// ---- public.garage_documents ----
export interface GarageDocument {
  id: string;
  garage_id: string;
  uploaded_by: string;
  doc_type: DocumentType;
  file_path: string;
  status: DocumentStatus;
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// ---- public.garage_certification_audit ----
export interface GarageCertificationAudit {
  id: string;
  garage_id: string;
  action: CertificationAction;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

// ---- Aggregated Database type pour supabase-js client ----
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'created_at'>;
        Update: Partial<Omit<Vehicle, 'id' | 'created_at' | 'user_id'>>;
      };
      garages: {
        Row: Garage;
        Insert: Omit<Garage, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count'>;
        Update: Partial<Omit<Garage, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'rating' | 'review_count'>>;
      };
      quote_requests: {
        Row: QuoteRequest;
        Insert: Omit<QuoteRequest, 'id' | 'created_at' | 'accepted_at' | 'completed_at'>;
        Update: Partial<Omit<QuoteRequest, 'id' | 'created_at' | 'conductor_id'>>;
      };
      quotes: {
        Row: Quote;
        Insert: Omit<Quote, 'id' | 'created_at'>;
        Update: Partial<Omit<Quote, 'id' | 'created_at' | 'request_id' | 'garage_id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'read'>;
        Update: Partial<Omit<Message, 'id' | 'created_at' | 'request_id' | 'sender_id' | 'recipient_id'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'approved' | 'flagged'>;
        Update: Partial<Omit<Review, 'id' | 'created_at' | 'request_id' | 'garage_id' | 'conductor_id'>>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, 'id' | 'created_at' | 'payment_date'>;
        Update: Partial<Omit<Invoice, 'id' | 'created_at' | 'request_id' | 'garage_id'>>;
      };
      notifications: {
        Row: AppNotification;
        Insert: Omit<AppNotification, 'id' | 'created_at' | 'read'>;
        Update: Partial<Omit<AppNotification, 'id' | 'created_at' | 'user_id'>>;
      };
      garage_documents: {
        Row: GarageDocument;
        Insert: Omit<GarageDocument, 'id' | 'created_at' | 'reviewed_by' | 'reviewed_at' | 'reject_reason'>;
        Update: Partial<Pick<GarageDocument, 'status' | 'reject_reason' | 'reviewed_by' | 'reviewed_at'>>;
      };
      garage_certification_audit: {
        Row: GarageCertificationAudit;
        Insert: Omit<GarageCertificationAudit, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: {
      user_profiles: {
        Row: UserProfile;
      };
    };
    Functions: {
      is_admin: {
        Args: unknown;
        Returns: boolean;
      };
      owns_garage: {
        Args: { g: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      app_language: AppLanguage;
      request_urgency: RequestUrgency;
      request_status: RequestStatus;
      payment_status: PaymentStatus;
      document_type: DocumentType;
      document_status: DocumentStatus;
      certification_action: CertificationAction;
    };
  };
}
