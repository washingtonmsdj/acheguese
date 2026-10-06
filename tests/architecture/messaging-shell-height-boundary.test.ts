import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appLayout = readFileSync(
  join(root, "src/app/components/AppLayoutSidebar.tsx"),
  "utf8",
);
const messagingCss = readFileSync(
  join(root, "src/modules/messaging/pages/MensagensPage.css"),
  "utf8",
);

describe("messaging shell height boundary", () => {
  it("keeps viewport ownership in the focused conversation shell", () => {
    expect(appLayout).toContain(
      'className="messaging-route-shell h-[100dvh] w-full overflow-hidden bg-territory-canvas"',
    );
    expect(messagingCss).toContain(
      ".messaging-route-shell .messaging-inbox {\n  height: 100%;\n}",
    );
  });

  it("does not make the normal inbox claim a second viewport", () => {
    const inboxRule = messagingCss.match(/\.messaging-inbox \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(inboxRule).toContain("min-height: 0;");
    expect(inboxRule).not.toContain("height: 100dvh");
  });
});
