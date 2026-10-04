import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("active notification and status visual SSOT", () => {
  it("projects the notifications surface through territory semantic tokens", () => {
    const source = [
      read("src/app/pages/NotificationsPage.tsx"),
      read("src/app/components/notifications/NotificationCenter.tsx"),
      read("src/app/components/notifications/NotificationItem.tsx"),
    ].join("\n");

    for (const token of [
      "border-territory-border",
      "bg-territory-surface",
      "bg-territory-raised",
      "text-territory-ink",
      "text-territory-muted",
      "text-territory-brand",
      "text-territory-success",
      "text-territory-warning",
      "text-territory-error",
      "text-territory-info",
    ]) {
      expect(source).toContain(token);
    }

    for (const legacy of [
      "text-muted-foreground",
      "bg-primary",
      "text-primary-foreground",
      "text-green-600",
      "text-yellow-600",
      "text-red-600",
      "text-blue-600",
      "bg-green-50",
      "bg-yellow-50",
      "bg-red-50",
      "bg-blue-50",
    ]) {
      expect(source).not.toContain(legacy);
    }
  });

  it("keeps the public status surface on the territory visual contract", () => {
    const source = read("src/app/pages/StatusPage.tsx");

    for (const token of [
      "bg-territory-canvas",
      "border-territory-border",
      "bg-territory-surface",
      "bg-territory-raised",
      "text-territory-ink",
      "text-territory-muted",
      "text-territory-brand",
    ]) {
      expect(source).toContain(token);
    }

    for (const legacy of [
      "bg-background",
      "text-foreground",
      "text-muted-foreground",
      "text-primary",
    ]) {
      expect(source).not.toContain(legacy);
    }
  });
});