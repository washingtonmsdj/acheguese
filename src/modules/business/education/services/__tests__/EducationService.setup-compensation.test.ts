import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EducationProfile } from "@/core/education";

const queryMocks = vi.hoisted(() => ({
  getEducationProfileByBusinessId: vi.fn(),
}));

const mutationMocks = vi.hoisted(() => ({
  createEducationProfile: vi.fn(),
  updateEducationProfile: vi.fn(),
  deleteEducationProfile: vi.fn(),
}));

vi.mock("@/core/education/services/education.queries", () => ({
  getEducationProfileByBusinessId: queryMocks.getEducationProfileByBusinessId,
}));

vi.mock("@/core/education/services/education.mutations", () => ({
  createEducationProfile: mutationMocks.createEducationProfile,
  updateEducationProfile: mutationMocks.updateEducationProfile,
  deleteEducationProfile: mutationMocks.deleteEducationProfile,
}));

import { EducationService } from "../EducationService";

const profile = {
  id: "education-profile-1",
  business_id: "business-1",
  institution_type: "school",
  niche_key: "regular_school",
  support_level: "basic_enabled",
  summary: null,
  whatsapp_number: null,
  status: "draft",
  published_at: null,
  created_at: "2026-09-04T00:00:00.000Z",
  updated_at: "2026-09-04T00:00:00.000Z",
} as EducationProfile;

const payload = {
  businessId: "business-1",
  institutionType: "school",
  nicheKey: "regular_school",
  summary: "Setup E2E",
};

describe("EducationService setup compensation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationMocks.deleteEducationProfile.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  it("removes only a profile created by the failing setup", async () => {
    queryMocks.getEducationProfileByBusinessId.mockResolvedValue(null);
    mutationMocks.createEducationProfile.mockResolvedValue({
      data: profile,
      error: null,
    });
    mutationMocks.updateEducationProfile.mockResolvedValue({
      data: null,
      error: new Error("update failed"),
    });

    await expect(EducationService.saveSetupProfile(payload)).resolves.toBeNull();

    expect(mutationMocks.deleteEducationProfile).toHaveBeenCalledTimes(1);
    expect(mutationMocks.deleteEducationProfile).toHaveBeenCalledWith(profile.id);
  });

  it("never deletes a pre-existing profile when setup update fails", async () => {
    queryMocks.getEducationProfileByBusinessId.mockResolvedValue(profile);
    mutationMocks.updateEducationProfile.mockResolvedValue({
      data: null,
      error: new Error("update failed"),
    });

    await expect(EducationService.saveSetupProfile(payload)).resolves.toBeNull();

    expect(mutationMocks.createEducationProfile).not.toHaveBeenCalled();
    expect(mutationMocks.deleteEducationProfile).not.toHaveBeenCalled();
  });

  it("keeps a newly created profile when setup succeeds", async () => {
    const saved = { ...profile, summary: "Setup E2E" };
    queryMocks.getEducationProfileByBusinessId.mockResolvedValue(null);
    mutationMocks.createEducationProfile.mockResolvedValue({
      data: profile,
      error: null,
    });
    mutationMocks.updateEducationProfile.mockResolvedValue({
      data: saved,
      error: null,
    });

    await expect(EducationService.saveSetupProfile(payload)).resolves.toEqual(saved);

    expect(mutationMocks.deleteEducationProfile).not.toHaveBeenCalled();
  });
});
