import type { EventCategory } from '../types';

import type { CreateEventInput } from '@/core/community-events';
import type { Json } from '@/shared/types/json';

export type OrganizerLocationType = 'physical' | 'online' | 'hybrid';

export interface EventsOrganizerGalleryItem {
  id: string;
  url: string;
  caption: string;
}

export interface EventsOrganizerScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker: string;
  location: string;
}

export interface EventsOrganizerFaqItem {
  id: string;
  question: string;
  answer: string;
}

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
  ticketPrice: number;
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
  gallery: EventsOrganizerGalleryItem[];
  schedule: EventsOrganizerScheduleItem[];
  faq: EventsOrganizerFaqItem[];
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
export type EventsOrganizerValidationIssue = {
  field: EventsOrganizerField;
  message: string;
};

type OrganizerInputText = string | null | undefined;
type OrganizerGalleryInput = Array<{
  id?: OrganizerInputText;
  url?: OrganizerInputText;
  caption?: OrganizerInputText;
}>;
type OrganizerScheduleInput = Array<{
  id?: OrganizerInputText;
  time?: OrganizerInputText;
  title?: OrganizerInputText;
  description?: OrganizerInputText;
  speaker?: OrganizerInputText;
  location?: OrganizerInputText;
}>;
type OrganizerFaqInput = Array<{
  id?: OrganizerInputText;
  question?: OrganizerInputText;
  answer?: OrganizerInputText;
}>;

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
  price?: number | null;
  tickets?: Array<{ price?: number }>;
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
  gallery?: OrganizerGalleryInput;
  schedule?: OrganizerScheduleInput;
  faq?: OrganizerFaqInput;
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
    ticketPrice:
      existingEvent?.price ??
      existingEvent?.tickets?.find((ticket) => typeof ticket.price === 'number')?.price ??
      0,
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
    gallery: normalizeGallery(existingEvent?.gallery),
    schedule: normalizeSchedule(existingEvent?.schedule),
    faq: normalizeFaq(existingEvent?.faq),
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

function toIsoDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createStableItemId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function normalizeGallery(gallery?: OrganizerGalleryInput): EventsOrganizerGalleryItem[] {
  return (gallery ?? [])
    .filter((item) => item.url?.trim())
    .map((item, index) => ({
      id: item.id || createStableItemId('gallery', index),
      url: item.url!.trim(),
      caption: item.caption?.trim() || '',
    }));
}

function normalizeSchedule(schedule?: OrganizerScheduleInput): EventsOrganizerScheduleItem[] {
  return (schedule ?? [])
    .filter((item) => item.title?.trim() || item.time?.trim())
    .map((item, index) => ({
      id: item.id || createStableItemId('schedule', index),
      time: item.time?.trim() || '',
      title: item.title?.trim() || '',
      description: item.description?.trim() || '',
      speaker: item.speaker?.trim() || '',
      location: item.location?.trim() || '',
    }));
}

function normalizeFaq(faq?: OrganizerFaqInput): EventsOrganizerFaqItem[] {
  return (faq ?? [])
    .filter((item) => item.question?.trim() || item.answer?.trim())
    .map((item, index) => ({
      id: item.id || createStableItemId('faq', index),
      question: item.question?.trim() || '',
      answer: item.answer?.trim() || '',
    }));
}

export function serializeOrganizerGallery(gallery?: OrganizerGalleryInput): Json[] {
  return normalizeGallery(gallery).map<Json>((item) => ({
    id: item.id,
    url: item.url,
    caption: item.caption,
  }));
}

export function serializeOrganizerSchedule(schedule?: OrganizerScheduleInput): Json[] {
  return normalizeSchedule(schedule).map<Json>((item) => ({
    id: item.id,
    time: item.time,
    title: item.title,
    description: item.description,
    speaker: item.speaker,
    location: item.location,
  }));
}

export function serializeOrganizerFaq(faq?: OrganizerFaqInput): Json[] {
  return normalizeFaq(faq).map<Json>((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
  }));
}

function getLocationLabel(formData: EventsOrganizerFormData): string {
  if (formData.locationType === 'online') {
    return formData.onlineUrl.trim() || formData.onlinePlatform.trim() || 'Evento online';
  }

  return [
    formData.venueName,
    formData.address,
    formData.neighborhood,
    formData.city,
    formData.state,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
}

export function getEventsOrganizerValidationIssues(
  formData: EventsOrganizerFormData,
): EventsOrganizerValidationIssue[] {
  const issues: EventsOrganizerValidationIssue[] = [];
  const isPhysical = formData.locationType === 'physical' || formData.locationType === 'hybrid';
  const isOnline = formData.locationType === 'online' || formData.locationType === 'hybrid';

  if (!formData.title.trim()) {
    issues.push({ field: 'title', message: 'Informe o titulo do evento.' });
  }

  if (!formData.shortDescription.trim() && !formData.description.trim()) {
    issues.push({ field: 'shortDescription', message: 'Informe uma descricao para o evento.' });
  }

  if (!formData.startDate.trim()) {
    issues.push({ field: 'startDate', message: 'Informe a data de inicio do evento.' });
  }

  if (isPhysical) {
    if (!formData.venueName.trim()) {
      issues.push({ field: 'venueName', message: 'Informe o nome do local.' });
    }
    if (!formData.address.trim()) {
      issues.push({ field: 'address', message: 'Informe o endereco do evento.' });
    }
    if (!formData.city.trim()) {
      issues.push({ field: 'city', message: 'Informe a cidade do evento.' });
    }
    if (!formData.state.trim()) {
      issues.push({ field: 'state', message: 'Informe o estado do evento.' });
    }
  }

  if (isOnline && !formData.onlineUrl.trim()) {
    issues.push({ field: 'onlineUrl', message: 'Informe o link do evento online.' });
  }

  if (formData.capacity < 0) {
    issues.push({ field: 'capacity', message: 'A capacidade nao pode ser negativa.' });
  }

  if (!formData.isFree && formData.ticketPrice <= 0) {
    issues.push({ field: 'ticketPrice', message: 'Informe o valor do ingresso pago.' });
  }

  if (formData.schedule.some((item) => !item.time.trim() || !item.title.trim())) {
    issues.push({
      field: 'schedule',
      message: 'Cada item da programacao precisa de horario e titulo.',
    });
  }

  if (formData.faq.some((item) => !item.question.trim() || !item.answer.trim())) {
    issues.push({
      field: 'faq',
      message: 'Cada pergunta frequente precisa de pergunta e resposta.',
    });
  }

  return issues;
}

export function buildCommunityEventInput(formData: EventsOrganizerFormData): CreateEventInput {
  const description = formData.description.trim() || formData.shortDescription.trim();

  const input: CreateEventInput = {
    title: formData.title.trim(),
    description,
    date: toIsoDateTime(formData.startDate),
    event_date: toIsoDateTime(formData.startDate),
    location: getLocationLabel(formData) || 'Local a definir',
    category: formData.category,
    subtitle: formData.subtitle.trim(),
    tags: splitCsv(formData.tags),
    duration_minutes: formData.durationMinutes || undefined,
    timezone: formData.timezone,
    location_type: formData.locationType,
    venue_name: formData.venueName.trim(),
    address: formData.address.trim(),
    neighborhood: formData.neighborhood.trim(),
    city: formData.city.trim(),
    state: formData.state.trim().toUpperCase(),
    zipcode: formData.zipcode.trim(),
    online_url: formData.onlineUrl.trim(),
    online_platform: formData.onlinePlatform.trim(),
    location_instructions: formData.locationInstructions.trim(),
    is_free: formData.isFree,
    price: formData.isFree ? 0 : formData.ticketPrice,
    waitlist_enabled: formData.waitlistEnabled,
    requirements: splitLines(formData.requirements),
    what_to_bring: splitLines(formData.whatToBring),
    age_restriction: formData.ageRestriction.trim(),
    dress_code: formData.dressCode.trim(),
    accessibility_info: formData.accessibilityInfo.trim(),
    banner_image_url: formData.bannerImage.trim(),
    video_url: formData.videoUrl.trim(),
    gallery: serializeOrganizerGallery(formData.gallery),
    schedule: serializeOrganizerSchedule(formData.schedule),
    faq: serializeOrganizerFaq(formData.faq),
    meta_title: formData.metaTitle.trim(),
    meta_description: formData.metaDescription.trim(),
    meta_keywords: splitCsv(formData.metaKeywords),
    features: {
      has_certificate: formData.hasCertificate,
      has_recording: formData.hasRecording,
      has_networking: formData.hasNetworking,
      has_food: formData.hasFood,
      has_parking: formData.hasParking,
      is_accessible: formData.isAccessible,
    },
    organizer_contact: {
      whatsapp: formData.organizerWhatsapp.trim(),
      instagram: formData.organizerInstagram.trim(),
      email: formData.organizerEmail.trim(),
      phone: formData.organizerPhone.trim(),
      website: formData.organizerWebsite.trim(),
    },
  };

  if (formData.endDate.trim()) {
    input.end_date = toIsoDateTime(formData.endDate);
  }

  if (formData.coverImage.trim()) {
    input.image_url = formData.coverImage.trim();
  }

  if (formData.capacity > 0) {
    input.max_participants = formData.capacity;
  }

  return input;
}
