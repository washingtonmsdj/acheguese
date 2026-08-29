import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function listRuntimeSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return listRuntimeSourceFiles(path);
    if (!/\.(ts|tsx)$/.test(entry) || /\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      return [];
    }
    return [path];
  });
}

const hardeningMigration = read(
  "supabase/migrations/20260829192000_harden_moderation_table_authority.sql",
);
const adminViewGrantMigration = read(
  "supabase/migrations/20260829193600_harden_admin_moderation_view_grants.sql",
);
const reportDialogBridge = read(
  "src/core/moderation/components/ReportReasonDialog.tsx",
);
const reportDialogUi = read(
  "src/shared/components/moderation/ReportReasonDialog.tsx",
);
const trustFeedbackUi = read(
  "src/shared/components/trust/TrustFeedbackForm.tsx",
);
const trustBarrel = read("src/core/trust/index.ts");

describe("Moderation and Trust boundaries", () => {
  it("keeps federated moderation UI in the Admin module and the read model in core", () => {
    expect(
      existsSync(
        resolve(root, "src/core/moderation/components/FederatedModerationQueue.tsx"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(root, "src/core/moderation/hooks/useFederatedModerationQueue.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(
          root,
          "src/modules/admin/components/moderation/FederatedModerationQueue.tsx",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(root, "src/modules/admin/hooks/useFederatedModerationQueue.ts"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          root,
          "src/core/moderation/services/FederatedModerationQueueService.ts",
        ),
      ),
    ).toBe(true);
  });

  it("keeps reusable moderation and trust presentation outside core and domain-neutral", () => {
    expect(
      existsSync(
        resolve(root, "src/shared/components/moderation/ReportReasonDialog.tsx"),
      ),
    ).toBe(true);
    expect(reportDialogBridge.trim()).toBe(
      'export { ReportReasonDialog } from "@/shared/components/moderation/ReportReasonDialog";',
    );
    expect(reportDialogBridge).not.toMatch(/from ["']react["']/);
    expect(reportDialogUi).not.toContain("@/core/");

    expect(
      existsSync(
        resolve(root, "src/shared/components/trust/TrustFeedbackForm.tsx"),
      ),
    ).toBe(true);
    expect(
      existsSync(resolve(root, "src/core/trust/components/TrustFeedbackForm.tsx")),
    ).toBe(false);
    expect(
      existsSync(resolve(root, "src/core/trust/components/index.ts")),
    ).toBe(false);
    expect(trustFeedbackUi).not.toContain("@/core/");
    expect(trustBarrel).toContain(
      'from "@/shared/components/trust/TrustFeedbackForm"',
    );
  });

  it("keeps Community report creation as the only direct runtime table writer", () => {
    const reportTableAccess = /\.from\(["']community_reports["']\)/;
    const accesses = listRuntimeSourceFiles(srcRoot)
      .filter((path) => reportTableAccess.test(readFileSync(path, "utf8")))
      .map((path) => relative(root, path).replace(/\\/g, "/"));

    expect(accesses).toEqual([
      "src/core/community/moderation/CommunityReportService.ts",
    ]);

    const owner = read("src/core/community/moderation/CommunityReportService.ts");
    expect(owner).toMatch(/from\(["']community_reports["']\)\.insert\(/);
    expect(owner).not.toMatch(/from\(["']community_reports["']\)[\s\S]{0,120}\.(update|delete)\(/);
  });

  it("keeps trust and moderation sensitive tables out of direct runtime browser access", () => {
    const sensitiveTables = [
      "trust_events",
      "trust_admin_actions",
      "banned_users",
      "community_user_moderation_actions",
      "community_social_audit_log",
    ];

    const violations = listRuntimeSourceFiles(srcRoot).flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return sensitiveTables
        .filter((table) =>
          new RegExp(`\\.from\\(["']${table}["']\\)`).test(source),
        )
        .map((table) => `${relative(root, path).replace(/\\/g, "/")}:${table}`);
    });

    expect(violations).toEqual([]);
  });

  it("locks report review and moderation actions behind server-owned commands", () => {
    expect(hardeningMigration).toContain(
      "REVOKE UPDATE, DELETE ON TABLE public.community_reports FROM authenticated",
    );
    expect(hardeningMigration).toContain(
      "DROP POLICY IF EXISTS community_reports_admin_update",
    );
    expect(hardeningMigration).toContain(
      "DROP POLICY IF EXISTS community_reports_admin_delete",
    );
    expect(hardeningMigration).toContain(
      "REVOKE SELECT ON TABLE public.community_user_moderation_actions FROM authenticated",
    );
    expect(hardeningMigration).toContain(
      "DROP POLICY IF EXISTS community_user_moderation_admin_read",
    );
  });

  it("keeps admin moderation views read-only in the browser", () => {
    for (const view of [
      "admin_pending_post_reports",
      "admin_pending_comment_reports",
    ]) {
      expect(adminViewGrantMigration).toContain(
        `REVOKE ALL ON TABLE public.${view} FROM anon`,
      );
      expect(adminViewGrantMigration).toContain(
        `REVOKE INSERT, UPDATE, DELETE ON TABLE public.${view}`,
      );
      expect(adminViewGrantMigration).toContain(
        `GRANT SELECT ON TABLE public.${view} TO authenticated`,
      );
    }
  });
});
