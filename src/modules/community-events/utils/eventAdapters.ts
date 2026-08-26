import type { PublicEvent } from "@/core/community-events";
import type { Event, EventCategory, EventFAQ, EventGalleryItem, EventScheduleItem } from "../types";
import { isEventCategory } from "../constants";
import { normalizePersistedTextEncoding } from "@/shared/utils/textEncodingRepair";

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

function asReadableString(value: unknown): string | undefined {
  const raw = asString(value);
  return raw ? normalizePersistedTextEncoding(raw) : undefined;
}

function asReadableStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((item) => asReadableString(item))
    .filter((item): item is string => Boolean(item));

  return items.length > 0 ? items : undefined;
}

function mapGallery(items: unknown[] | null | undefined): EventGalleryItem[] {
  return (items ?? [])
    .map<EventGalleryItem | null>((item, index) => {
      const record = readStringRecord(item);
      const url = asString(record.url);
      if (!url) return null;

      return {
        id: asString(record.id) ?? `gallery-${index + 1}`,
        url,
        type: "image" as const,
        caption: asReadableString(record.caption),
        order: index,
      };
    })
    .filter((item): item is EventGalleryItem => item !== null);
}

function mapSchedule(items: unknown[] | null | undefined): EventScheduleItem[] {
  return (items ?? [])
    .map<EventScheduleItem | null>((item, index) => {
      const record = readStringRecord(item);
      const title = asString(record.title);
      const time = asString(record.time);
      if (!title || !time) return null;

      return {
        id: asString(record.id) ?? `schedule-${index + 1}`,
        time,
        title: normalizePersistedTextEncoding(title),
        description: asReadableString(record.description),
        speaker: asReadableString(record.speaker),
        location: asReadableString(record.location),
      };
    })
    .filter((item): item is EventScheduleItem => item !== null);
}

function mapFaq(items: unknown[] | null | undefined): EventFAQ[] {
  return (items ?? [])
    .map<EventFAQ | null>((item, index) => {
      const record = readStringRecord(item);
      const question = asString(record.question);
      const answer = asString(record.answer);
      if (!question || !answer) return null;

      return {
        id: asString(record.id) ?? `faq-${index + 1}`,
        question: normalizePersistedTextEncoding(question),
        answer: normalizePersistedTextEncoding(answer),
        order: index,
      };
    })
    .filter((item): item is EventFAQ => item !== null);
}

export function mapCommunityEventToEvent(input: PublicEvent): Event {
  const description = normalizePersistedTextEncoding(input.description ?? "");
  const location = normalizePersistedTextEncoding(input.location ?? "");
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
    title: normalizePersistedTextEncoding(input.title),
    subtitle: asReadableString(input.subtitle),
    description,
    short_description: description,
    cover_image_url: input.image_url || "/placeholder.svg",
    banner_image_url: asString(input.banner_image_url),
    video_url: asString(input.video_url),
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
      venue_name: asReadableString(input.venue_name) ?? location,
      address: asReadableString(input.address) ?? location,
      city: asReadableString(input.city),
      state: asReadableString(input.state),
      neighborhood: asReadableString(input.neighborhood) ?? location,
      zipcode: asString(input.zipcode),
      online_url: asString(input.online_url),
      online_platform: asReadableString(input.online_platform),
      instructions: asReadableString(input.location_instructions),
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
    requirements: asReadableStringArray(input.requirements),
    what_to_bring: asReadableStringArray(input.what_to_bring),
    accessibility_info: asReadableString(input.accessibility_info),
    age_restriction: asReadableString(input.age_restriction),
    dress_code: asReadableString(input.dress_code),
    faq,
    views_count: 0,
    favorites_count: 0,
    shares_count: 0,
    meta_title: asReadableString(input.meta_title),
    meta_description: asReadableString(input.meta_description),
    meta_keywords: asReadableStringArray(input.meta_keywords),
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
