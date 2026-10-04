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

  it("keeps the authenticated email history on the territory visual contract", () => {
    const source = read("src/app/pages/EmailLogsPage.tsx");

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
      "bg-muted-foreground",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "text-success",
      "text-destructive",
      "text-warning",
    ]) {
      expect(source).not.toContain(legacy);
    }

    expect(source).toContain("Histórico de e-mails");
    expect(source).not.toContain("Histórico de Emails");
  });

  it("keeps waitlist anti-abuse feedback semantic instead of hardcoded colors", () => {
    const source = read("src/app/pages/PreLaunchWaitlist.tsx");

    for (const token of [
      "border-territory-border",
      "bg-territory-raised",
      "text-territory-success",
      "text-territory-warning",
      "text-territory-error",
    ]) {
      expect(source).toContain(token);
    }

    for (const hardcoded of [
      "border-slate-200",
      "bg-slate-50",
      "bg-red-50",
      "text-red-700",
      "bg-orange-50",
      "text-orange-800",
      "bg-[#18B37E]/10",
      "text-[#0f6f50]",
    ]) {
      expect(source).not.toContain(hardcoded);
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
