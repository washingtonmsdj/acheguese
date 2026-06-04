import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    storage: {
      from: storageMocks.from,
    },
  },
}));

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
