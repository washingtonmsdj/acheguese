import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const businessDetail = readFileSync(
  "src/modules/business/company/pages/TerritoryBusinessDetail.tsx",
  "utf8",
);

describe("TerritoryBusinessDetail dynamic link boundary", () => {
  it("renders validated contact targets through SafeLink", () => {
    expect(businessDetail).toContain(
      'import { SafeLink } from "@/shared/components/security/SafeLink";',
    );
    expect(businessDetail).toContain("const phoneHref = buildTelUrl(phone);");
    expect(businessDetail).toContain("const whatsappHref = buildWhatsAppUrl(whatsapp);");
    expect(businessDetail).toContain("const instagramHref = buildInstagramUrl(business.instagram);");
    expect(businessDetail).toContain("const facebookHref = buildFacebookUrl(business.facebook);");
    expect(businessDetail).toContain("const websiteHref = buildWebsiteUrl(institutional.website);");
    expect(businessDetail).toContain('<SafeLink className="bd-phone" href={phoneHref}>');
    expect(businessDetail).toContain('<SafeLink className="bd-order-button" href={whatsappHref} target="_blank">');
    expect(businessDetail).not.toContain("window.open(whatsappHref");
    expect(businessDetail).not.toContain('href={`tel:${phone.replace');
    expect(businessDetail).not.toContain('<a href={whatsappHref}');
    expect(businessDetail).not.toContain('<a href={socialUrl(');
    expect(businessDetail).not.toContain('<a href={normalizeUrl(');
  });
});
