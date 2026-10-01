import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  featureBusinessEq: vi.fn(),
  featurePhotoEq: vi.fn(),
  siblingBusinessEq: vi.fn(),
  siblingPhotoNeq: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    from: mocks.from,
  },
}));

vi.mock("@/core/media/services/MediaService", () => ({
  mediaService: {
    uploadMediaAsset: vi.fn(),
  },
}));

import { businessGalleryService } from "../BusinessGalleryService";

const BUSINESS_DATA_ID = "11111111-1111-4111-8111-111111111111";
const PHOTO_ID = "22222222-2222-4222-8222-222222222222";

describe("BusinessGalleryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update
      .mockReturnValueOnce({ eq: mocks.featureBusinessEq })
      .mockReturnValueOnce({ eq: mocks.siblingBusinessEq });

    mocks.featureBusinessEq.mockReturnValue({ eq: mocks.featurePhotoEq });
    mocks.featurePhotoEq.mockResolvedValue({ error: null });

    mocks.siblingBusinessEq.mockReturnValue({ neq: mocks.siblingPhotoNeq });
    mocks.siblingPhotoNeq.mockResolvedValue({ error: null });
  });

  it("scopes both cover updates to the same business gallery", async () => {
    await businessGalleryService.setFeatured(BUSINESS_DATA_ID, PHOTO_ID);

    expect(mocks.from).toHaveBeenNthCalledWith(1, "business_gallery");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "business_gallery");

    expect(mocks.update).toHaveBeenNthCalledWith(1, { is_featured: true });
    expect(mocks.featureBusinessEq).toHaveBeenCalledWith(
      "business_id",
      BUSINESS_DATA_ID,
    );
    expect(mocks.featurePhotoEq).toHaveBeenCalledWith("id", PHOTO_ID);

    expect(mocks.update).toHaveBeenNthCalledWith(2, { is_featured: false });
    expect(mocks.siblingBusinessEq).toHaveBeenCalledWith(
      "business_id",
      BUSINESS_DATA_ID,
    );
    expect(mocks.siblingPhotoNeq).toHaveBeenCalledWith("id", PHOTO_ID);
  });
});
