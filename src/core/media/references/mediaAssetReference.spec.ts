import { describe, expect, it } from "vitest";

import {
  isMediaAssetReference,
  isMediaAssetReferenceForPreset,
  parseMediaAssetReference,
  resolveMediaAssetReference,
  resolveMediaAssetSource,
  resolveMediaAssetSources,
  toMediaAssetReference,
} from "./mediaAssetReference";

const ownerProfileId = "11111111-1111-4111-8111-111111111111";
const assetId = "22222222-2222-4222-8222-222222222222";

describe("media asset references", () => {
  it("round-trips a versioned preset reference", () => {
    const reference = toMediaAssetReference({
      assetId,
      ownerProfileId,
      preset: "review_photo",
    });

    expect(parseMediaAssetReference(reference)).toEqual({
      assetId,
      ownerProfileId,
      path: `${ownerProfileId}/review_photo/v1/${assetId}.jpg`,
      preset: "review_photo",
      presetVersion: 1,
    });
    expect(isMediaAssetReference(reference)).toBe(true);
  });

  it("resolves canonical references without accepting arbitrary URLs", () => {
    const reference = toMediaAssetReference({
      assetId,
      ownerProfileId,
      preset: "gastronomy_menu_item",
    });

    expect(
      resolveMediaAssetReference(reference, "https://project.supabase.co"),
    ).toBe(
      `https://project.supabase.co/storage/v1/object/public/media-assets/${ownerProfileId}/gastronomy_menu_item/v1/${assetId}.jpg`,
    );
    expect(
      resolveMediaAssetSource("https://tracker.example/pixel.jpg"),
    ).toBeNull();
    expect(resolveMediaAssetSource("/images/fixture.jpg")).toBe(
      "/images/fixture.jpg",
    );
  });

  it("validates post presets and resolves reference collections", () => {
    const reference = toMediaAssetReference({
      assetId,
      ownerProfileId,
      preset: "post_image",
    });

    expect(isMediaAssetReferenceForPreset(reference, "post_image")).toBe(true);
    expect(isMediaAssetReferenceForPreset(reference, "review_photo")).toBe(
      false,
    );
    const sources = resolveMediaAssetSources(
      [reference, "https://tracker.example/pixel.jpg"],
      "post_image",
    );
    expect(sources).toHaveLength(1);
    expect(sources[0]).toContain(
      `/storage/v1/object/public/media-assets/${ownerProfileId}/post_image/v1/${assetId}.jpg`,
    );
  });

  it("rejects a valid asset reference from the wrong preset", () => {
    const reference = toMediaAssetReference({
      assetId,
      ownerProfileId,
      preset: "business_gallery",
    });

    expect(resolveMediaAssetSource(reference, "post_image")).toBeNull();
  });

  it("rejects unknown presets, path traversal and non-jpeg objects", () => {
    expect(
      isMediaAssetReference(
        `storage://media-assets/${ownerProfileId}/unknown/v1/${assetId}.jpg`,
      ),
    ).toBe(false);
    expect(
      isMediaAssetReference(
        `storage://media-assets/${ownerProfileId}/review_photo/v1/../${assetId}.jpg`,
      ),
    ).toBe(false);
    expect(
      isMediaAssetReference(
        `storage://media-assets/${ownerProfileId}/review_photo/v1/${assetId}.svg`,
      ),
    ).toBe(false);
  });
});
