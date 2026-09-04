import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const retired = [
  "src/modules/business/components/BusinessTabs.tsx",
  "src/modules/business/components/QuickActions.tsx",
  "src/modules/business/components/BookingButton.tsx",
  "src/modules/business/components/AppointmentsPanel.tsx",
  "src/modules/business/components/AppointmentNotifications.tsx",
  "src/modules/business/components/tabs/AgendamentosTab.tsx",
  "src/modules/business/components/appointments/AppointmentCard.tsx",
  "src/modules/business/components/appointments/AppointmentDetailsModal.tsx",
  "src/modules/business/components/appointments/AppointmentFilters.tsx",
  "src/modules/business/components/appointments/EmptyAppointments.tsx",
  "src/modules/business/components/appointments/constants.ts",
  "src/shared/hooks/useAppointments.ts",
];

describe("G6 Business appointment surface ownership", () => {
  it("keeps the orphaned simulated appointment flow retired", () => {
    for (const relativePath of retired) {
      expect(existsSync(join(ROOT, relativePath))).toBe(false);
    }
  });

  it("does not publish the retired appointment API from barrels", () => {
    const moduleBarrel = readFileSync(
      join(ROOT, "src/modules/business/components/index.ts"),
      "utf8",
    );
    const sharedHooksBarrel = readFileSync(
      join(ROOT, "src/shared/hooks/index.ts"),
      "utf8",
    );

    for (const symbol of [
      "BookingButton",
      "QuickActions",
      "AppointmentsPanel",
      "AppointmentNotifications",
      "AgendamentosTab",
      "AppointmentCard",
      "AppointmentDetailsModal",
      "AppointmentFilters",
      "EmptyAppointments",
    ]) {
      expect(moduleBarrel).not.toContain(symbol);
    }

    expect(sharedHooksBarrel).not.toContain("useAppointments");
  });
});
