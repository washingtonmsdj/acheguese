import type { CommunityEvent } from "@/core/community/services/CommunityEventsRuntimeService";
import type { Event, EventCategory } from "../types";
import { isEventCategory } from "../constants";

const LEGACY_EVENT_TEXT_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\u00c3\u0081/g, "Á"],
  [/\u00c3\u0080/g, "À"],
  [/\u00c3\u0082/g, "Â"],
  [/\u00c3\u0083/g, "Ã"],
  [/\u00c3\u0087/g, "Ç"],
  [/\u00c3\u0089/g, "É"],
  [/\u00c3\u008a/g, "Ê"],
  [/\u00c3\u008d/g, "Í"],
  [/\u00c3\u0093/g, "Ó"],
  [/\u00c3\u0094/g, "Ô"],
  [/\u00c3\u0095/g, "Õ"],
  [/\u00c3\u009a/g, "Ú"],
  [/\u00c3\u00a1/g, "á"],
  [/\u00c3\u00a0/g, "à"],
  [/\u00c3\u00a2/g, "â"],
  [/\u00c3\u00a3/g, "ã"],
  [/\u00c3\u00a7/g, "ç"],
  [/\u00c3\u00a9/g, "é"],
  [/\u00c3\u00aa/g, "ê"],
  [/\u00c3\u00ad/g, "í"],
  [/\u00c3\u00b3/g, "ó"],
  [/\u00c3\u00b4/g, "ô"],
  [/\u00c3\u00b5/g, "õ"],
  [/\u00c3\u00ba/g, "ú"],
  [/Pr\?tico/g, "Prático"],
  [/pr\?tico/g, "prático"],
  [/Voc\?/g, "Você"],
  [/voc\?/g, "você"],
  [/Inscri\?\?o/g, "Inscrição"],
  [/inscri\?\?o/g, "inscrição"],
  [/Descri\?\?o/g, "Descrição"],
  [/descri\?\?o/g, "descrição"],
  [/Informa\?\?es/g, "Informações"],
  [/informa\?\?es/g, "informações"],
  [/Programa\?\?o/g, "Programação"],
  [/programa\?\?o/g, "programação"],
  [/Notifica\?\?o/g, "Notificação"],
  [/notifica\?\?o/g, "notificação"],
  [/Notifica\?\?es/g, "Notificações"],
  [/notifica\?\?es/g, "notificações"],
  [/Hor\?rio/g, "Horário"],
  [/hor\?rio/g, "horário"],
  [/Hor\?rios/g, "Horários"],
  [/hor\?rios/g, "horários"],
  [/D\?vida/g, "Dúvida"],
  [/d\?vida/g, "dúvida"],
  [/D\?vidas/g, "Dúvidas"],
  [/d\?vidas/g, "dúvidas"],
  [/Dispon\?vel/g, "Disponível"],
  [/dispon\?vel/g, "disponível"],
  [/Dispon\?veis/g, "Disponíveis"],
  [/dispon\?veis/g, "disponíveis"],
  [/Neg\?cio/g, "Negócio"],
  [/neg\?cio/g, "negócio"],
  [/Neg\?cios/g, "Negócios"],
  [/neg\?cios/g, "negócios"],
  [/M\?sica/g, "Música"],
  [/m\?sica/g, "música"],
  [/H\?brido/g, "Híbrido"],
  [/h\?brido/g, "híbrido"],
  [/P\?blico/g, "Público"],
  [/p\?blico/g, "público"],
  [/P\?blica/g, "Pública"],
  [/p\?blica/g, "pública"],
  [/Audit\?rio/g, "Auditório"],
  [/audit\?rio/g, "auditório"],
  [/Comunit\?rio/g, "Comunitário"],
  [/comunit\?rio/g, "comunitário"],
];

function normalizeEventText(value?: string | null): string {
  if (!value) {
    return "";
  }

  const sanitized = value.replace(/\uFFFD/g, "?");

  return LEGACY_EVENT_TEXT_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    sanitized,
  );
}

function toEventCategory(category?: string): EventCategory {
  if (isEventCategory(category)) {
    return category;
  }
  return "comunitario";
}

export function mapCommunityEventToEvent(input: CommunityEvent): Event {
  const description = normalizeEventText(input.description);
  const location = normalizeEventText(input.location);

  return {
    id: input.id,
    slug: input.id,
    title: normalizeEventText(input.title),
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
        name: "Inscrição gratuita",
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
