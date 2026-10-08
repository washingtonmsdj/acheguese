import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MEDIA_IMAGE_SOURCE_MIME_TYPES,
  MEDIA_PRESET_CLIENT_CONFIG,
} from "@/core/media/config/mediaPresets";

const editPage = readFileSync(
  "src/modules/business/pages/EditarEmpresaPage.tsx",
  "utf8",
);
const mediaService = readFileSync(
  "src/core/media/services/MediaService.ts",
  "utf8",
);

describe("Business edit media and identity SSOT", () => {
  it("never retains a previous Business slug when switching to a slugless company", () => {
    expect(editPage).toContain('const businessSlug = business.slug ?? "";');
    expect(editPage).toContain("setSlug(businessSlug);");
    expect(editPage).toContain("setOriginalSlug(businessSlug);");
    expect(editPage).not.toContain("if (businessSlug) {");
  });

  it("uses shared MIME and upload limits on both editing inputs and broker client", () => {
    expect(MEDIA_IMAGE_SOURCE_MIME_TYPES).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
    expect(MEDIA_IMAGE_SOURCE_MIME_TYPES).not.toContain("image/svg+xml");
    expect(MEDIA_PRESET_CLIENT_CONFIG.business_logo.maxSourceBytes).toBeGreaterThan(0);
    expect(MEDIA_PRESET_CLIENT_CONFIG.business_banner.maxSourceBytes).toBeGreaterThan(0);
    expect(mediaService).toContain("ALLOWED_IMAGE_TYPES = MEDIA_IMAGE_SOURCE_MIME_TYPES");
    expect(editPage).toContain("MEDIA_PRESET_CLIENT_CONFIG.business_logo.maxSourceBytes");
    expect(editPage).toContain("MEDIA_PRESET_CLIENT_CONFIG.business_banner.maxSourceBytes");
    expect(editPage).toContain("MEDIA_IMAGE_SOURCE_MIME_TYPES.some(");
    expect(editPage).not.toContain('file.type.startsWith("image/")');
  });

  it("never calls a completed asset upload a committed Business update", () => {
    expect(editPage).toContain("Logo enviado. Salve as alterações para publicá-lo.");
    expect(editPage).toContain("Capa enviada. Salve as alterações para publicá-la.");
    expect(editPage).toContain(
      'form.setValue("logo_url", url, { shouldDirty: true, shouldValidate: true });',
    );
    expect(editPage).toContain(
      'form.setValue("banner_url", url, { shouldDirty: true, shouldValidate: true });',
    );
  });

  it("does not save while a media upload is in flight or accept a late response", () => {
    expect(editPage).toContain("const logoUploadSequenceRef = useRef(0);");
    expect(editPage).toContain("const capaUploadSequenceRef = useRef(0);");
    expect(editPage).toContain("if (uploadId !== logoUploadSequenceRef.current) return;");
    expect(editPage).toContain("if (uploadId !== capaUploadSequenceRef.current) return;");
    expect(editPage).toContain("if (pendingMediaUploadsRef.current > 0) {");
    expect(editPage).toContain("Aguarde o envio das imagens antes de salvar a empresa.");
    expect(editPage).toContain("saving={saving || pendingMediaUploads > 0}");
    expect(editPage).not.toContain('toast.success("Logo atualizado!")');
    expect(editPage).not.toContain('toast.success("Capa atualizada!")');
  });

  it("exports the Business image picker from the canonical core hook without a module shim", () => {
    expect(existsSync("src/modules/business/hooks/useBusinessImageUpload.ts")).toBe(false);
    const publicModule = readFileSync("src/modules/business/index.ts", "utf8");
    expect(publicModule).toContain(
      'export { useBusinessImageUpload } from "@/core/business/hooks/useBusinessImageUpload";',
    );
  });

  it("does not retain an admin update facade that re-reads after the commit", () => {
    const adminService = readFileSync(
      "src/core/admin/services/AdminBusinessService.ts",
      "utf8",
    );
    expect(adminService).not.toMatch(/async updateBusiness\\(/);
  });

  it("does not retain the unused direct business_data settings writer", () => {
    expect(
      existsSync("src/core/business/services/BusinessSettingsService.ts"),
    ).toBe(false);
  });
});
