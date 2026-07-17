import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
}));

const functionMocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: {
      invoke: functionMocks.invoke,
    },
    storage: {
      from: storageMocks.from,
    },
  },
}));

vi.mock("@/shared/utils/imageOptimizer", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/shared/utils/imageOptimizer")
  >();
  return {
    ...actual,
    optimizeImage: vi.fn(async () =>
      new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "upload.jpg", {
        type: "image/jpeg",
      }),
    ),
  };
});

import { MediaError, mediaService } from "./MediaService";

beforeEach(() => {
  storageMocks.from.mockReturnValue({
    upload: storageMocks.upload,
    getPublicUrl: storageMocks.getPublicUrl,
    remove: storageMocks.remove,
  });
  storageMocks.upload.mockResolvedValue({ error: null });
  storageMocks.getPublicUrl.mockReturnValue({
    data: { publicUrl: "https://cdn.example.com/unused-public-url.pdf" },
  });
  storageMocks.remove.mockResolvedValue({ error: null });
  functionMocks.invoke.mockReset();
  vi.clearAllMocks();
});

describe("MediaError", () => {
  it("preserves a stable operational error code", () => {
    const error = new MediaError("Arquivo invalido", "INVALID_FILE_TYPE");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MediaError");
    expect(error.code).toBe("INVALID_FILE_TYPE");
  });
});

describe("mediaService upload validation", () => {
  it("returns a validated canonical reference from the media broker", async () => {
    const ownerProfileId = "11111111-1111-4111-8111-111111111111";
    const assetId = "22222222-2222-4222-8222-222222222222";
    const reference =
      `storage://media-assets/${ownerProfileId}/review_photo/v1/${assetId}.jpg`;
    functionMocks.invoke.mockResolvedValue({
      data: {
        asset: {
          id: assetId,
          reference,
          preset: "review_photo",
          presetVersion: 1,
          mimeType: "image/jpeg",
          byteSize: 4,
          width: 640,
          height: 640,
        },
      },
      error: null,
    });

    const result = await mediaService.uploadMediaAsset(
      ownerProfileId,
      new File(["source"], "source.png", { type: "image/png" }),
      "review_photo",
    );

    expect(result.reference).toBe(reference);
    expect(result.ownerProfileId).toBe(ownerProfileId);
    expect(result.preset).toBe("review_photo");
    expect(functionMocks.invoke).toHaveBeenCalledWith(
      "media-assets",
      expect.objectContaining({ body: expect.any(FormData) }),
    );
    expect(storageMocks.upload).not.toHaveBeenCalled();
  });

  it("rejects inconsistent metadata returned by the media broker", async () => {
    const ownerProfileId = "11111111-1111-4111-8111-111111111111";
    const assetId = "22222222-2222-4222-8222-222222222222";
    functionMocks.invoke.mockResolvedValue({
      data: {
        asset: {
          id: assetId,
          reference:
            `storage://media-assets/${ownerProfileId}/review_photo/v1/${assetId}.jpg`,
          preset: "post_image",
          presetVersion: 1,
          mimeType: "image/jpeg",
          byteSize: 4,
          width: 640,
          height: 640,
        },
      },
      error: null,
    });

    await expect(
      mediaService.uploadMediaAsset(
        ownerProfileId,
        new File(["source"], "source.png", { type: "image/png" }),
        "review_photo",
      ),
    ).rejects.toMatchObject({ code: "INVALID_UPLOAD_RESPONSE" });
  });

  it("keeps PDF address proof private with the expected path and content type", async () => {
    const file = new File(["%PDF-1.4"], "proof.pdf", { type: "application/pdf" });

    const url = await mediaService.uploadVerificationDocument("profile-1", file, "proof");

    expect(url).toMatch(/^storage:\/\/verification-documents\/profile-1\/proof_\d+\.pdf$/);
    expect(storageMocks.from).toHaveBeenCalledWith("verification-documents");
    expect(storageMocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^profile-1\/proof_\d+\.pdf$/),
      file,
      { upsert: true, contentType: "application/pdf" },
    );
    expect(storageMocks.getPublicUrl).not.toHaveBeenCalled();
  });

  it("rejects non-image bucket uploads before storage is called", async () => {
    const file = new File(["not an image"], "payload.txt", { type: "text/plain" });

    await expect(
      mediaService.uploadToBucket(file, { bucket: "banners" }),
    ).rejects.toMatchObject({ code: "INVALID_FILE_TYPE" });

    expect(storageMocks.upload).not.toHaveBeenCalled();
  });
});
