import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
  createSignedUrl: vi.fn(),
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
    createSignedUrl: storageMocks.createSignedUrl,
  });
  storageMocks.upload.mockResolvedValue({ error: null });
  storageMocks.getPublicUrl.mockReturnValue({
    data: { publicUrl: "https://cdn.example.com/tryon/input.jpg" },
  });
  storageMocks.remove.mockResolvedValue({ error: null });
  storageMocks.createSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://signed.example.com/private-object" },
    error: null,
  });
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

  it("uploads private evidence without creating a public URL", async () => {
    const file = new File(["evidence"], "clip.mp4", { type: "video/mp4" });
    const path = "11111111-1111-4111-8111-111111111111/evidence.mp4";

    const result = await mediaService.uploadPrivateFile(file, {
      bucket: "safety-evidence",
      path,
      allowedMimeTypes: ["video/mp4"],
      maxSizeBytes: 10 * 1024 * 1024,
    });

    expect(result).toEqual({
      path,
      reference: `storage://safety-evidence/${path}`,
    });
    expect(storageMocks.from).toHaveBeenCalledWith("safety-evidence");
    expect(storageMocks.upload).toHaveBeenCalledWith(path, file, {
      upsert: false,
      contentType: "video/mp4",
    });
    expect(storageMocks.getPublicUrl).not.toHaveBeenCalled();
  });

  it("creates bounded signed URLs for private evidence", async () => {
    const signedUrl = await mediaService.createPrivateSignedUrl(
      "safety-evidence",
      "11111111-1111-4111-8111-111111111111/evidence.pdf",
      9999,
    );

    expect(signedUrl).toBe("https://signed.example.com/private-object");
    expect(storageMocks.createSignedUrl).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111/evidence.pdf",
      900,
    );
  });

  it("uses the generic public helper only for Try-On staging", async () => {
    const file = new File(["image"], "garment.png", { type: "image/png" });

    const result = await mediaService.uploadToBucket(file, {
      bucket: "tryon",
      pathPrefix: "user-1/inputs",
      fileName: "garment",
      upsert: false,
    });

    expect(storageMocks.from).toHaveBeenCalledWith("tryon");
    expect(storageMocks.upload).toHaveBeenCalledWith(
      "user-1/inputs/garment.jpg",
      expect.objectContaining({ type: "image/jpeg" }),
      { upsert: false, contentType: "image/jpeg" },
    );
    expect(storageMocks.getPublicUrl).toHaveBeenCalledWith(
      "user-1/inputs/garment.jpg",
    );
    expect(result).toEqual({
      url: "https://cdn.example.com/tryon/input.jpg",
      path: "user-1/inputs/garment.jpg",
    });
  });

  it("rejects non-image Try-On uploads before storage is called", async () => {
    const file = new File(["not an image"], "payload.txt", { type: "text/plain" });

    await expect(
      mediaService.uploadToBucket(file, { bucket: "tryon" }),
    ).rejects.toMatchObject({ code: "INVALID_FILE_TYPE" });

    expect(storageMocks.upload).not.toHaveBeenCalled();
  });
});
