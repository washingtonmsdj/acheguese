import { describe, expect, it } from "vitest";
import type { Post } from "@/core/posts/types";
import type { PublicEvent } from "@/core/community-events";
import {
  isCurrentOrFutureEvent,
  hasTechnicalSeedLabel,
  selectEventsHappeningSoon,
  selectRecentPosts,
  selectValidEvents,
} from "./territoryHomeFreshness";

const NOW = Date.parse("2026-08-12T15:00:00.000Z");

function event(input: Pick<PublicEvent, "id" | "date" | "status"> & Partial<PublicEvent>): PublicEvent {
  return {
    title: `Evento ${input.id}`,
    description: "Descrição pública",
    location: "Salvador",
    organizer_profile_id: "profile-1",
    category: "community",
    current_participants: 0,
    created_at: "2026-08-01T12:00:00.000Z",
    updated_at: "2026-08-01T12:00:00.000Z",
    ...input,
  };
}

function post(id: string, createdAt: string): Post {
  return {
    id,
    author_profile_id: "profile-1",
    type: "text",
    content: `Post ${id}`,
    likes_count: 0,
    comments_count: 0,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

describe("territoryHomeFreshness", () => {
  it("rejeita evento upcoming vencido mesmo quando o status remoto continua ativo", () => {
    const stale = event({
      id: "stale",
      date: "2026-08-10T12:00:00.000Z",
      status: "upcoming",
    });

    expect(isCurrentOrFutureEvent(stale, NOW)).toBe(false);
    expect(selectValidEvents([stale], NOW)).toEqual([]);
  });

  it("mantém evento em andamento dentro da data final e futuro ordenado", () => {
    const ongoing = event({
      id: "ongoing",
      date: "2026-08-12T12:00:00.000Z",
      end_date: "2026-08-12T18:00:00.000Z",
      status: "ongoing",
    });
    const future = event({
      id: "future",
      date: "2026-08-13T10:00:00.000Z",
      status: "upcoming",
    });

    expect(selectValidEvents([future, ongoing], NOW).map((item) => item.id)).toEqual([
      "ongoing",
      "future",
    ]);
    expect(selectEventsHappeningSoon([future, ongoing], NOW).map((item) => item.id)).toEqual([
      "ongoing",
      "future",
    ]);
  });

  it("não trata evento ongoing sem fim como atual indefinidamente", () => {
    const staleOngoing = event({
      id: "stale-ongoing",
      date: "2026-08-10T12:00:00.000Z",
      status: "ongoing",
    });

    expect(isCurrentOrFutureEvent(staleOngoing, NOW)).toBe(false);
  });

  it("limita o resumo comunitário a atividade real dos últimos 30 dias", () => {
    const recent = post("recent", "2026-08-11T12:00:00.000Z");
    const old = post("old", "2026-05-17T12:00:00.000Z");
    const future = post("future", "2026-08-13T12:00:00.000Z");

    expect(selectRecentPosts([old, future, recent], NOW).map((item) => item.id)).toEqual([
      "recent",
    ]);
  });

  it("identifica rótulos técnicos sem bloquear nomes públicos comuns", () => {
    expect(hasTechnicalSeedLabel("Consultoria Premium AI Seed")).toBe(true);
    expect(hasTechnicalSeedLabel("E2E Debug Rede")).toBe(true);
    expect(hasTechnicalSeedLabel("e2e-standalone-test-rede")).toBe(true);
    expect(hasTechnicalSeedLabel("Dados mock_data")).toBe(true);
    expect(hasTechnicalSeedLabel("Sabor da Bahia")).toBe(false);
  });
});
