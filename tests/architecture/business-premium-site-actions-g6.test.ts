import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Business premium site actions (G6)", () => {
  it("wires every premium link action to the canonical browser/QR path", () => {
    const page = fs.readFileSync(
      path.join(
        ROOT,
        "src/modules/business/dashboard/pages/BusinessPremiumSitePage.tsx",
      ),
      "utf8",
    );

    expect(page).toContain('import { QrImageGenerator } from "@/core/qr"');
    expect(page).toContain(
      'new URL(premiumUrl, window.location.origin).toString()',
    );
    expect(page).toContain('window.open(url, "_blank", "noopener,noreferrer")');
    expect(page).toContain("QrImageGenerator.generatePNG(url");
    expect(page).toContain("QrImageGenerator.downloadImage(");
    expect(page).toContain("QrImageGenerator.copyToClipboard(url)");
    expect(page).toContain("onClick={handlePreview}");
    expect(page).toContain("onClick={() => void handleGenerateQr()}");
    expect(page).toContain("onClick={() => void handleCopy()}");
    expect(page).toContain("disabled={!isPremiumEnabled}");
  });
});
