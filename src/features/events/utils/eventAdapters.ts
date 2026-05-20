import type { CommunityEvent } from "@/core/community/services/CommunityEventsRuntimeService";
import type { Event, EventCategory } from "../types";
import { isEventCategory } from "../constants";

function toEventCategory(category?: string): EventCategory {
  if (isEventCategory(category)) {
    return category;
  }
  return "comunitario";
}

export function mapCommunityEventToEvent(input: CommunityEvent): Event {
  const description = input.description ?? "";
  const location = input.location ?? "";

  return {
    id: input.id,
    slug: input.id,
    title: input.title,
    description,
    short_description: description,
    cover_image_url: input.image_url || "/placeholder.svg",
    category: toEventCategory(input.category),
    type: "presencial",
    status: input.status === "cancelled" ? "cancelado" : "publicado",
    start_date: input.date,
    timezone: "America/Sao_Paulo",
    location: {
      type: "physical",
      venue_name: location,
      address: location,
      city: undefined,
      state: undefined,
      neighborhood: location,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
    },
    organizer: {
      id: input.organizer_profile_id,
      name: "Organizador da comunidade",
      verified: false,
      contact: {},
    },
    ticket_type: "gratuito",
    tickets: [
      {
        id: `${input.id}-free`,
        name: "Inscricao gratuita",
        price: 0,
        currency: "BRL",
        quantity_total: input.max_participants ?? Math.max(input.current_participants, 100),
        quantity_available: Math.max(
          0,
          (input.max_participants ?? Math.max(input.current_participants, 100)) - input.current_participants,
        ),
        quantity_sold: input.current_participants,
        status: "disponivel",
        is_free: true,
      },
    ],
    is_free: true,
    capacity: input.max_participants ?? undefined,
    participants_count: input.current_participants,
    waitlist_enabled: false,
    views_count: 0,
    favorites_count: 0,
    shares_count: 0,
    created_at: input.created_at,
    updated_at: input.updated_at,
  };
}
