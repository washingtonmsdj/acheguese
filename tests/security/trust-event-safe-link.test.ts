import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const trustEventQueueCard = readFileSync(
  "src/core/admin/components/TrustEventQueueCard.tsx",
  "utf8",
);

describe("TrustEventQueueCard dynamic link safety", () => {
  it("validates the generated classified public URL through SafeLink", () => {
    expect(trustEventQueueCard).toContain(
      'import { SafeLink } from "@/shared/components/security/SafeLink";',
    );
    expect(trustEventQueueCard).toContain(
      '<SafeLink href={publicUrlQuery.data} allowInternal target="_blank">',
    );
    expect(trustEventQueueCard).not.toContain(
      '<a href={publicUrlQuery.data}',
    );
  });
});
