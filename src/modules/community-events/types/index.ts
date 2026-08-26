/**
 * EVENTS - TYPE DEFINITIONS
 * 
 * Sistema de tipos completo para a nova arquitetura de eventos
 * Preparado para eventos gratuitos, pagos, hibridos, online e presenciais
 * 
 * @version 2.0.0
 * @author Kiro AI
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EventType = 'presencial' | 'online' | 'hibrido';
export type EventStatus = 'rascunho' | 'publicado' | 'cancelado' | 'finalizado' | 'em_andamento';
export type EventCategory = 'cultural' | 'esportivo' | 'social' | 'religioso' | 'educacional' | 'gastronomico' | 'artistico' | 'comunitario';
export type TicketType = 'gratuito' | 'pago' | 'hibrido';
export type TicketStatus = 'disponivel' | 'esgotado' | 'em_breve';

// ============================================================================
// TICKET & PRICING
// ============================================================================

export interface EventTicket {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity_total: number;
  quantity_available: number;
  quantity_sold: number;
  sales_start?: string;
  sales_end?: string;
  min_per_order?: number;
  max_per_order?: number;
  status: TicketStatus;
  is_free: boolean;
}

// ============================================================================
// LOCATION & VENUE
// ============================================================================

export interface EventLocation {
  type: 'physical' | 'online' | 'hybrid';
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  online_url?: string;
  online_platform?: string;
  instructions?: string;
}

// ============================================================================
// ORGANIZER
// ============================================================================

export interface EventOrganizer {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  verified: boolean;
  contact: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
  stats?: {
    events_created: number;
    total_participants: number;
    rating?: number;
  };
}

// ============================================================================
// SCHEDULE & AGENDA
// ============================================================================

export interface EventScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  speaker?: string;
  location?: string;
}

// ============================================================================
// GALLERY
// ============================================================================

export interface EventGalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
  caption?: string;
  order: number;
}

// ============================================================================
// FAQ
// ============================================================================

export interface EventFAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

// ============================================================================
// MAIN EVENT INTERFACE
// ============================================================================

export interface Event {
  // Basic Info
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  short_description?: string;
  
  // Media
  cover_image_url: string;
  banner_image_url?: string;
  video_url?: string;
  gallery?: EventGalleryItem[];
  
  // Classification
  category: EventCategory;
  tags?: string[];
  type: EventType;
  status: EventStatus;
  
  // Date & Time
  start_date: string;
  end_date?: string;
  timezone: string;
  duration_minutes?: number;
  
  // Location
  location: EventLocation;
  
  // Organizer
  organizer: EventOrganizer;
  co_organizers?: EventOrganizer[];
  
  // Tickets & Pricing
  ticket_type: TicketType;
  tickets: EventTicket[];
  is_free: boolean;
  
  // Capacity
  capacity?: number;
  participants_count: number;
  waitlist_enabled: boolean;
  waitlist_count?: number;
  
  // Schedule
  schedule?: EventScheduleItem[];
  
  // Additional Info
  requirements?: string[];
  what_to_bring?: string[];
  accessibility_info?: string;
  age_restriction?: string;
  dress_code?: string;
  
  // FAQ
  faq?: EventFAQ[];
  
  // Social & Engagement
  views_count: number;
  favorites_count: number;
  shares_count: number;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // Features
  features?: {
    has_certificate: boolean;
    has_recording: boolean;
    has_networking: boolean;
    has_food: boolean;
    has_parking: boolean;
    is_accessible: boolean;
  };
  
  // Related
  related_events?: string[];
  
  // Community
  community_id?: string;
  neighborhood?: string;
  territory?: string;
}

// ============================================================================
// REGISTRATION & PARTICIPATION
// ============================================================================

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  quantity: number;
  total_amount: number;
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  confirmation_code: string;
  registered_at: string;
  checked_in_at?: string;
}

// ============================================================================
// FILTERS & SEARCH
// ============================================================================

export interface EventFilters {
  category?: EventCategory;
  type?: EventType;
  ticket_type?: TicketType;
  date_from?: string;
  date_to?: string;
  price_min?: number;
  price_max?: number;
  location?: string;
  neighborhood?: string;
  search?: string;
  organizer_id?: string;
  is_free?: boolean;
  has_availability?: boolean;
}

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

export interface EventStats {
  views: number;
  favorites: number;
  shares: number;
  registrations: number;
  attendance_rate?: number;
  revenue?: number;
  conversion_rate?: number;
}

// ============================================================================
// CTA CONFIGURATION
// ============================================================================

export interface EventCTA {
  type: 'register' | 'contact' | 'external' | 'waitlist';
  label: string;
  action: string;
  enabled: boolean;
  contact_methods?: {
    whatsapp?: string;
    instagram?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
}
