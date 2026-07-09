import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClassifiedLinkEligibilityService } from "@/core/classifieds/services/ClassifiedLinkEligibilityService";
import { TouristPointLinkEligibilityService } from "@/core/guide/tourist-points/services/TouristPointLinkEligibilityService";
import { PostLinkEligibilityService } from "@/core/posts/services/PostLinkEligibilityService";
import { ProfessionalLinkEligibilityService } from "@/core/professional/services/ProfessionalLinkEligibilityService";
import { EventLinkEligibilityService } from "@/core/verticals/events/services/EventLinkEligibilityService";

const mocks = vi.hoisted(() => ({
  getClassifiedById: vi.fn(),
  getTouristPointById: vi.fn(),
  getPostById: vi.fn(),
  getProfessionalById: vi.fn(),
  getEventById: vi.fn(),
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock("@/core/classifieds/services/classifieds.queries", () => ({
  getClassifiedById: mocks.getClassifiedById,
}));

vi.mock("@/core/guide/tourist-points/services/TouristPointQueryService", () => ({
  TouristPointQueryService: {
    getById: mocks.getTouristPointById,
  },
}));

vi.mock("@/core/posts/services/posts.queries", () => ({
  getPostById: mocks.getPostById,
}));

vi.mock("@/core/professional/services/ProfessionalService", () => ({
  ProfessionalService: {
    getProfessionalById: mocks.getProfessionalById,
  },
}));

vi.mock("@/core/verticals/events/services/EventReadService", () => ({
  eventsReadService: {
    getEventById: mocks.getEventById,
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: mocks.logger,
}));

describe("community entity link domain eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows only active classifieds", async () => {
    mocks.getClassifiedById.mockResolvedValue({
      id: "classified-1",
      is_active: true,
      status: "active",
    });

    await expect(
      ClassifiedLinkEligibilityService.isCommunityLinkEligible("classified-1"),
    ).resolves.toBe(true);

    mocks.getClassifiedById.mockResolvedValue({
      id: "classified-1",
      is_active: false,
      status: "sold",
    });

    await expect(
      ClassifiedLinkEligibilityService.isCommunityLinkEligible("classified-1"),
    ).resolves.toBe(false);
  });

  it("allows only public listed professionals accepting clients", async () => {
    mocks.getProfessionalById.mockResolvedValue({
      id: "professional-1",
      is_accepting_clients: true,
      visibility: "public_listed",
    });

    await expect(
      ProfessionalLinkEligibilityService.isCommunityLinkEligible("professional-1"),
    ).resolves.toBe(true);

    mocks.getProfessionalById.mockResolvedValue({
      id: "professional-1",
      is_accepting_clients: true,
      visibility: "public_unlisted",
    });

    await expect(
      ProfessionalLinkEligibilityService.isCommunityLinkEligible("professional-1"),
    ).resolves.toBe(false);
  });

  it("allows only upcoming or ongoing events", async () => {
    mocks.getEventById.mockResolvedValue({
      id: "event-1",
      status: "ongoing",
    });

    await expect(
      EventLinkEligibilityService.isCommunityLinkEligible("event-1"),
    ).resolves.toBe(true);

    mocks.getEventById.mockResolvedValue({
      id: "event-1",
      status: "cancelled",
    });

    await expect(
      EventLinkEligibilityService.isCommunityLinkEligible("event-1"),
    ).resolves.toBe(false);
  });

  it("allows only posts that are published and visible", async () => {
    mocks.getPostById.mockResolvedValue({
      id: "post-1",
      is_published: true,
      is_hidden: false,
      is_removed: false,
    });

    await expect(
      PostLinkEligibilityService.isCommunityLinkEligible("post-1"),
    ).resolves.toBe(true);

    mocks.getPostById.mockResolvedValue({
      id: "post-1",
      is_published: true,
      is_hidden: true,
      is_removed: false,
    });

    await expect(
      PostLinkEligibilityService.isCommunityLinkEligible("post-1"),
    ).resolves.toBe(false);
  });

  it("allows only published tourist points", async () => {
    mocks.getTouristPointById.mockResolvedValue({
      id: "tourist-point-1",
      status: "published",
    });

    await expect(
      TouristPointLinkEligibilityService.isCommunityLinkEligible("tourist-point-1"),
    ).resolves.toBe(true);

    mocks.getTouristPointById.mockResolvedValue({
      id: "tourist-point-1",
      status: "draft",
    });

    await expect(
      TouristPointLinkEligibilityService.isCommunityLinkEligible("tourist-point-1"),
    ).resolves.toBe(false);
  });
});
