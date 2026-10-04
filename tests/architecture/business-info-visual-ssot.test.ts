import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const owners = [
  "src/modules/business/company/sections/EmpresaInfoSection.tsx",
  "src/modules/business/company/components/info/AddressCard.tsx",
  "src/modules/business/company/components/info/HoursCard.tsx",
  "src/modules/business/company/components/info/PaymentCard.tsx",
  "src/modules/business/company/components/info/ContactCard.tsx",
  "src/modules/business/company/components/info/FacilitiesCard.tsx",
] as const;

describe("Business public info visual SSOT", () => {
  it("keeps the active company info surface on semantic territorial tokens", () => {
    for (const path of owners) {
      const source = read(path);
      expect(source, path).toContain("territory-");
      expect(source, path).not.toMatch(/(?:text|bg|border)-(?:white|black|teal|emerald|rose|sky)(?:\/|\-|\b)/);
      expect(source, path).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source, path).not.toMatch(/rgba?\(/);
    }
  });

  it("preserves semantic status ownership for hours, payment and copied-phone feedback", () => {
    const hours = read("src/modules/business/company/components/info/HoursCard.tsx");
    const payment = read("src/modules/business/company/components/info/PaymentCard.tsx");
    const contact = read("src/modules/business/company/components/info/ContactCard.tsx");

    expect(hours).toContain("territory-success");
    expect(hours).toContain("territory-error");
    expect(payment).toContain("territory-success");
    expect(payment).toContain("territory-info");
    expect(contact).toContain("territory-success");
  });

  it("keeps the mini-map marker and fallback bound to territorial theme variables", () => {
    const address = read("src/modules/business/company/components/info/AddressCard.tsx");

    expect(address).toContain('markerColor="hsl(var(--territory-brand))"');
    expect(address).toContain('fallbackClassName="bg-territory-raised"');
  });
});
