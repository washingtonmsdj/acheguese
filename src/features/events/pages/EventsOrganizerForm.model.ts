import type { EventCategory } from '../types';

export type OrganizerLocationType = 'physical' | 'online' | 'hybrid';

export interface EventsOrganizerFormData {
  [key: string]: unknown;
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  category: EventCategory;
  tags: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  timezone: string;
  locationType: OrganizerLocationType;
  venueName: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  onlineUrl: string;
  onlinePlatform: string;
  locationInstructions: string;
  isFree: boolean;
  capacity: number;
  waitlistEnabled: boolean;
  requirements: string;
  whatToBring: string;
  ageRestriction: string;
  dressCode: string;
  accessibilityInfo: string;
  coverImage: string;
  bannerImage: string;
  videoUrl: string;
  gallery: string[];
  schedule: unknown[];
  faq: unknown[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  hasCertificate: boolean;
  hasRecording: boolean;
  hasNetworking: boolean;
  hasFood: boolean;
  hasParking: boolean;
  isAccessible: boolean;
  organizerWhatsapp: string;
  organizerInstagram: string;
  organizerEmail: string;
  organizerPhone: string;
  organizerWebsite: string;
}

export type EventsOrganizerField = keyof EventsOrganizerFormData;
export type EventsOrganizerFieldChange = (field: EventsOrganizerField, value: unknown) => void;

interface ExistingEventLike {
  title?: string;
  subtitle?: string;
  short_description?: string;
  description?: string;
  category?: EventCategory;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  duration_minutes?: number;
  timezone?: string;
  location?: {
    type?: OrganizerLocationType;
    venue_name?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    online_url?: string;
    online_platform?: string;
    instructions?: string;
  };
  is_free?: boolean;
  capacity?: number;
  waitlist_enabled?: boolean;
  requirements?: string[];
  what_to_bring?: string[];
  age_restriction?: string;
  dress_code?: string;
  accessibility_info?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  video_url?: string;
  gallery?: Array<{ url: string }>;
  schedule?: unknown[];
  faq?: unknown[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  features?: {
    has_certificate?: boolean;
    has_recording?: boolean;
    has_networking?: boolean;
    has_food?: boolean;
    has_parking?: boolean;
    is_accessible?: boolean;
  };
  organizer?: {
    contact?: {
      whatsapp?: string;
      instagram?: string;
      email?: string;
      phone?: string;
      website?: string;
    };
  };
}

export function buildEventsOrganizerFormData(existingEvent?: ExistingEventLike | null): EventsOrganizerFormData {
  return {
    title: existingEvent?.title || '',
    subtitle: existingEvent?.subtitle || '',
    shortDescription: existingEvent?.short_description || '',
    description: existingEvent?.description || '',
    category: existingEvent?.category || 'cultural',
    tags: existingEvent?.tags?.join(', ') || '',
    startDate: existingEvent?.start_date || '',
    endDate: existingEvent?.end_date || '',
    durationMinutes: existingEvent?.duration_minutes || 0,
    timezone: existingEvent?.timezone || 'America/Sao_Paulo',
    locationType: existingEvent?.location?.type || 'physical',
    venueName: existingEvent?.location?.venue_name || '',
    address: existingEvent?.location?.address || '',
    neighborhood: existingEvent?.location?.neighborhood || '',
    city: existingEvent?.location?.city || '',
    state: existingEvent?.location?.state || '',
    zipcode: existingEvent?.location?.zipcode || '',
    onlineUrl: existingEvent?.location?.online_url || '',
    onlinePlatform: existingEvent?.location?.online_platform || '',
    locationInstructions: existingEvent?.location?.instructions || '',
    isFree: existingEvent?.is_free || true,
    capacity: existingEvent?.capacity || 0,
    waitlistEnabled: existingEvent?.waitlist_enabled || false,
    requirements: existingEvent?.requirements?.join('\n') || '',
    whatToBring: existingEvent?.what_to_bring?.join('\n') || '',
    ageRestriction: existingEvent?.age_restriction || '',
    dressCode: existingEvent?.dress_code || '',
    accessibilityInfo: existingEvent?.accessibility_info || '',
    coverImage: existingEvent?.cover_image_url || '',
    bannerImage: existingEvent?.banner_image_url || '',
    videoUrl: existingEvent?.video_url || '',
    gallery: existingEvent?.gallery?.map((image) => image.url) || [],
    schedule: existingEvent?.schedule || [],
    faq: existingEvent?.faq || [],
    metaTitle: existingEvent?.meta_title || '',
    metaDescription: existingEvent?.meta_description || '',
    metaKeywords: existingEvent?.meta_keywords?.join(', ') || '',
    hasCertificate: existingEvent?.features?.has_certificate || false,
    hasRecording: existingEvent?.features?.has_recording || false,
    hasNetworking: existingEvent?.features?.has_networking || false,
    hasFood: existingEvent?.features?.has_food || false,
    hasParking: existingEvent?.features?.has_parking || false,
    isAccessible: existingEvent?.features?.is_accessible || false,
    organizerWhatsapp: existingEvent?.organizer?.contact?.whatsapp || '',
    organizerInstagram: existingEvent?.organizer?.contact?.instagram || '',
    organizerEmail: existingEvent?.organizer?.contact?.email || '',
    organizerPhone: existingEvent?.organizer?.contact?.phone || '',
    organizerWebsite: existingEvent?.organizer?.contact?.website || '',
  };
}
