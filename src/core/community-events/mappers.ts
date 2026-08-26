import type { Json } from "@/integrations/supabase";
import type {
  EventRow,
  PublicEvent,
  PublicEventCoordinateSource,
  PublicEventLocationType,
  PublicEventStatus,
} from "@/core/community-events/types";

export type EventRowWithLegacyCity = EventRow & {
  city?: string | null;
};

function isPublicEventStatus(value: string | null | undefined): value is PublicEventStatus {
  return value === "upcoming" || value === "ongoing" || value === "completed" || value === "cancelled";
}

function toPublicEventStatus(value: string | null | undefined): PublicEventStatus {
  return isPublicEventStatus(value) ? value : "upcoming";
}

function toLocationType(value: string | null | undefined): PublicEventLocationType | null {
  if (value === "physical" || value === "online" || value === "hybrid") return value;
  return null;
}

function toCoordinateSource(value: string | null | undefined): PublicEventCoordinateSource | null {
  if (value === "exact" || value === "geocoded" || value === "approximate") return value;
  return null;
}

function toJsonArray(value: Json | null | undefined): Json[] | null {
  return Array.isArray(value) ? value : null;
}

function toJsonRecord(value: Json | null | undefined): Record<string, Json> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Json>;
}

export function mapEventRow(row: EventRowWithLegacyCity): PublicEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    date: row.date,
    end_date: row.end_date,
    event_date: row.event_date,
    location: row.location ?? "",
    location_id: row.location_id,
    organizer_profile_id: row.organizer_profile_id,
    category: row.category ?? "comunitario",
    image_url: row.image_url,
    subtitle: row.subtitle,
    tags: row.tags,
    duration_minutes: row.duration_minutes,
    timezone: row.timezone,
    location_type: toLocationType(row.location_type),
    venue_name: row.venue_name,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city ?? null,
    state: row.state,
    zipcode: row.zipcode,
    online_url: row.online_url,
    online_platform: row.online_platform,
    location_instructions: row.location_instructions,
    is_free: row.is_free,
    price: row.price,
    waitlist_enabled: row.waitlist_enabled,
    requirements: row.requirements,
    what_to_bring: row.what_to_bring,
    age_restriction: row.age_restriction,
    dress_code: row.dress_code,
    accessibility_info: row.accessibility_info,
    banner_image_url: row.banner_image_url,
    video_url: row.video_url,
    gallery: toJsonArray(row.gallery),
    schedule: toJsonArray(row.schedule),
    faq: toJsonArray(row.faq),
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    meta_keywords: row.meta_keywords,
    features: toJsonRecord(row.features),
    organizer_contact: toJsonRecord(row.organizer_contact),
    published_at: row.published_at,
    max_participants: row.max_participants,
    current_participants: row.current_participants,
    status: toPublicEventStatus(row.status),
    created_at: row.created_at,
    updated_at: row.updated_at,
    latitude: row.latitude,
    longitude: row.longitude,
    coordinate_source: toCoordinateSource(row.coordinate_source),
  };
}
