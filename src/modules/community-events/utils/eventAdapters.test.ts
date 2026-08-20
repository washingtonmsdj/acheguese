import { describe, expect, it } from "vitest";
import type { PublicEvent } from "@/core/events";
import { mapCommunityEventToEvent } from "./eventAdapters";

const baseCommunityEvent: PublicEvent = {
  id: "event-legacy-encoding",
  title: "Workshop pr?tico de neg?cios",
  description: "Workshop pr?tico sobre empreendedorismo digital e vendas online.",
  date: "2026-05-20T19:00:00.000Z",
  location: "Audit?rio comunit?rio",
  organizer_profile_id: "organizer-1",
  category: "workshop",
  current_participants: 12,
  max_participants: 40,
  status: "upcoming",
  created_at: "2026-05-01T10:00:00.000Z",
  updated_at: "2026-05-01T10:00:00.000Z",
};

describe("mapCommunityEventToEvent", () => {
  it("normalizes legacy replacement characters before the event reaches the UI", () => {
    const event = mapCommunityEventToEvent(baseCommunityEvent);

    expect(event.title).toBe("Workshop prático de negócios");
    expect(event.description).toBe("Workshop prático sobre empreendedorismo digital e vendas online.");
    expect(event.short_description).toBe("Workshop prático sobre empreendedorismo digital e vendas online.");
    expect(event.location.venue_name).toBe("Auditório comunitário");
  });

  it("normalizes UTF-8 mojibake from persisted event text", () => {
    const event = mapCommunityEventToEvent({
      ...baseCommunityEvent,
      title: "Inscri\u00c3\u00a7\u00c3\u00a3o aberta",
      description: "Programa\u00c3\u00a7\u00c3\u00a3o dispon\u00c3\u00advel para voc\u00c3\u00aa.",
      location: "S\u00c3\u00a3o Paulo",
    });

    expect(event.title).toBe("Inscrição aberta");
    expect(event.description).toBe("Programação disponível para você.");
    expect(event.location.address).toBe("São Paulo");
  });
});
