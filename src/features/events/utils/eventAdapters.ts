import type { CommunityEvent } from "@/core/community/services/CommunityEventsRuntimeService";
import type { Event, EventCategory, EventFAQ, EventGalleryItem, EventScheduleItem } from "../types";
import { isEventCategory } from "../constants";

function toEventCategory(category?: string): EventCategory {
  if (isEventCategory(category)) {
    return category;
  }
  return "comunitario";
}

function toEventType(type?: string | null): Event["type"] {
  if (type === "online") return "online";
  if (type === "hybrid") return "hibrido";
  return "presencial";
}

function readStringRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function mapGallery(items: unknown[] | null | undefined): EventGalleryItem[] {
  return (items ?? [])
    .map((item, index) => {
      const record = readStringRecord(item);
      const url = asString(record.url);
      if (!url) return null;

      return {
        id: asString(record.id) ?? `gallery-${index + 1}`,
        url,
        type: "image" as const,
        caption: asString(record.caption),
        order: index,
      };
    })
    .filter((item): item is EventGalleryItem => Boolean(item));
}

function mapSchedule(items: unknown[] | null | undefined): EventScheduleItem[] {
  return (items ?? [])
    .map((item, index) => {
      const record = readStringRecord(item);
      const title = asString(record.title);
      const time = asString(record.time);
      if (!title || !time) return null;

      return {
        id: asString(record.id) ?? `schedule-${index + 1}`,
        time,
        title,
        description: asString(record.description),
        speaker: asString(record.speaker),
        location: asString(record.location),
      };
    })
    .filter((item): item is EventScheduleItem => Boolean(item));
}

function mapFaq(items: unknown[] | null | undefined): EventFAQ[] {
  return (items ?? [])
    .map((item, index) => {
      const record = readStringRecord(item);
      const question = asString(record.question);
      const answer = asString(record.answer);
      if (!question || !answer) return null;

      return {
        id: asString(record.id) ?? `faq-${index + 1}`,
        question,
        answer,
        order: index,
      };
    })
    .filter((item): item is EventFAQ => Boolean(item));
}

export function mapCommunityEventToEvent(input: CommunityEvent): Event {
  const description = input.description ?? "";
  const location = input.location ?? "";
  const organizerContact = readStringRecord(input.organizer_contact);
  const features = readStringRecord(input.features);
  const capacity = input.max_participants ?? undefined;
  const price = input.price ?? 0;
  const isFree = input.is_free ?? price === 0;
  const gallery = mapGallery(input.gallery);
  const schedule = mapSchedule(input.schedule);
  const faq = mapFaq(input.faq);

  return {
    id: input.id,
    slug: input.id,
    title: input.title,
    subtitle: input.subtitle ?? undefined,
    description,
    short_description: description,
    cover_image_url: input.image_url || "/placeholder.svg",
    banner_image_url: input.banner_image_url ?? undefined,
    video_url: input.video_url ?? undefined,
    gallery,
    category: toEventCategory(input.category),
    tags: input.tags ?? undefined,
    type: toEventType(input.location_type),
    status: input.status === "cancelled" ? "cancelado" : "publicado",
    start_date: input.date,
    end_date: input.end_date ?? undefined,
    timezone: input.timezone ?? "America/Sao_Paulo",
    duration_minutes: input.duration_minutes ?? undefined,
    location: {
      type: input.location_type ?? "physical",
      venue_name: input.venue_name ?? location,
      address: input.address ?? location,
      city: input.city ?? undefined,
      state: input.state ?? undefined,
      neighborhood: input.neighborhood ?? location,
      zipcode: input.zipcode ?? undefined,
      online_url: input.online_url ?? undefined,
      online_platform: input.online_platform ?? undefined,
      instructions: input.location_instructions ?? undefined,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
    },
    organizer: {
      id: input.organizer_profile_id,
      name: "Organizador da comunidade",
      verified: false,
      contact: {
        whatsapp: asString(organizerContact.whatsapp),
        instagram: asString(organizerContact.instagram),
        email: asString(organizerContact.email),
        phone: asString(organizerContact.phone),
        website: asString(organizerContact.website),
      },
    },
    ticket_type: isFree ? "gratuito" : "pago",
    tickets: [
      {
        id: `${input.id}-${isFree ? "free" : "paid"}`,
        name: isFree ? "Inscricao gratuita" : "Ingresso",
        price,
        currency: "BRL",
        quantity_total: capacity ?? Math.max(input.current_participants, 100),
        quantity_available: Math.max(
          0,
          (capacity ?? Math.max(input.current_participants, 100)) - input.current_participants,
        ),
        quantity_sold: input.current_participants,
        status: "disponivel",
        is_free: isFree,
      },
    ],
    is_free: isFree,
    capacity,
    participants_count: input.current_participants,
    waitlist_enabled: input.waitlist_enabled ?? false,
    schedule,
    requirements: input.requirements ?? undefined,
    what_to_bring: input.what_to_bring ?? undefined,
    accessibility_info: input.accessibility_info ?? undefined,
    age_restriction: input.age_restriction ?? undefined,
    dress_code: input.dress_code ?? undefined,
    faq,
    views_count: 0,
    favorites_count: 0,
    shares_count: 0,
    meta_title: input.meta_title ?? undefined,
    meta_description: input.meta_description ?? undefined,
    meta_keywords: input.meta_keywords ?? undefined,
    created_at: input.created_at,
    updated_at: input.updated_at,
    published_at: input.published_at ?? undefined,
    features: {
      has_certificate: Boolean(features.has_certificate),
      has_recording: Boolean(features.has_recording),
      has_networking: Boolean(features.has_networking),
      has_food: Boolean(features.has_food),
      has_parking: Boolean(features.has_parking),
      is_accessible: Boolean(features.is_accessible),
    },
  };
}
