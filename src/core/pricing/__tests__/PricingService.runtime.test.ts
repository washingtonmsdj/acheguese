/**
 * Runtime validation for the persisted pricing-rule repository.
 *
 * These tests exercise administrative CRUD/audit behavior only. Numeric values
 * are isolated test fixtures and are not commercial mobility policy.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pricingService } from "../instance";
import {
  authenticateAsConfiguredAdminProfile,
  signOut,
} from "../../../../tests/helpers/auth-helper";
import { getAdminClient } from "../../../../tests/helpers/supabase-test-client";
import { getMissingOperationalEnv } from "../../../../tests/helpers/operational-env";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const MISSING_RUNTIME_ENV = getMissingOperationalEnv({ requireServiceRole: true });
const HAS_EXPLICIT_ADMIN_CREDENTIALS = Boolean(
  process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD,
);
const HAS_RUNTIME =
  MISSING_RUNTIME_ENV.length === 0 &&
  HAS_EXPLICIT_ADMIN_CREDENTIALS &&
  SUPABASE_URL.length > 0 &&
  !SUPABASE_URL.includes("placeholder.supabase.co") &&
  !SUPABASE_URL.includes("your-project.supabase.co");

function skipIfNoRuntime(): boolean {
  return !HAS_RUNTIME;
}

describe("PricingService - persisted rule runtime", () => {
  let testProfileId: string;
  let activeCustomRuleIdsBefore: string[] = [];
  let supabaseAdmin: ReturnType<typeof getAdminClient>;

  async function cleanupRuntimeRules(): Promise<void> {
    await supabaseAdmin
      .from("pricing_rules")
      .delete()
      .ilike("name", "Teste%");
  }

  beforeAll(async () => {
    if (skipIfNoRuntime()) return;
    supabaseAdmin = getAdminClient();
    await cleanupRuntimeRules();

    const { data: activeCustomRules } = await supabaseAdmin
      .from("pricing_rules")
      .select("id")
      .eq("mode", "custom")
      .eq("is_active", true);
    activeCustomRuleIdsBefore = (activeCustomRules ?? []).map((rule) => rule.id);

    testProfileId = await authenticateAsConfiguredAdminProfile();
  });

  afterAll(async () => {
    if (skipIfNoRuntime()) return;

    await cleanupRuntimeRules();
    if (activeCustomRuleIdsBefore.length > 0) {
      await supabaseAdmin
        .from("pricing_rules")
        .update({ is_active: true, updated_by: testProfileId })
        .in("id", activeCustomRuleIdsBefore);
    }
    pricingService.clearCache();
    await signOut();
  });

  it("rejects client-owned peak schedules before touching the database", async () => {
    await expect(
      pricingService.createRule(
        {
          mode: "custom",
          name: "Teste Pico Invalido",
          baseFare: 1,
          pricePerKm: 1,
          pricePerMinute: 1,
          minimumFare: 1,
          isActive: false,
          metadata: { runtime_test: true, commercial_status: "provisional" },
          peakHourMultipliers: { morning: 1.5 },
        },
        "00000000-0000-4000-8000-000000000001",
      ),
    ).rejects.toMatchObject({ name: "PricingError" });
  });

  it("creates an inactive provisional rule and optional additional fee", async () => {
    if (skipIfNoRuntime()) return;

    const ruleId = await pricingService.createRule(
      {
        mode: "custom",
        name: "Teste Runtime",
        baseFare: 10,
        pricePerKm: 3,
        pricePerMinute: 0.6,
        minimumFare: 15,
        maximumFare: 100,
        isActive: false,
        metadata: {
          runtime_test: true,
          commercial_status: "provisional",
        },
        additionalFees: [
          {
            id: "test-fee",
            label: "Taxa de teste",
            amount: 2.5,
            type: "fixed",
          },
        ],
      },
      testProfileId,
    );

    const { data: rule } = await supabaseAdmin
      .from("pricing_rules")
      .select("*")
      .eq("id", ruleId)
      .single();

    expect(rule?.mode).toBe("custom");
    expect(rule?.name).toBe("Teste Runtime");
    expect(rule?.is_active).toBe(false);
    expect(rule?.metadata).toMatchObject({
      runtime_test: true,
      commercial_status: "provisional",
    });

    const { data: fees } = await supabaseAdmin
      .from("pricing_additional_fees")
      .select("*")
      .eq("rule_id", ruleId);
    expect(fees).toHaveLength(1);
  });

  it("keeps only one active custom rule when creating a replacement", async () => {
    if (skipIfNoRuntime()) return;

    const firstRuleId = await pricingService.createRule(
      {
        mode: "custom",
        name: "Teste Ativa Inicial",
        baseFare: 6,
        pricePerKm: 2,
        pricePerMinute: 0.4,
        minimumFare: 9,
        isActive: true,
        metadata: { runtime_test: true, commercial_status: "provisional" },
      },
      testProfileId,
    );

    const secondRuleId = await pricingService.createRule(
      {
        mode: "custom",
        name: "Teste Ativa Substituta",
        baseFare: 7,
        pricePerKm: 2.2,
        pricePerMinute: 0.5,
        minimumFare: 10,
        isActive: true,
        metadata: { runtime_test: true, commercial_status: "provisional" },
      },
      testProfileId,
    );

    const { data: activeRules } = await supabaseAdmin
      .from("pricing_rules")
      .select("id")
      .eq("mode", "custom")
      .eq("is_active", true);

    expect(activeRules?.map((rule) => rule.id)).toEqual([secondRuleId]);
    expect(firstRuleId).not.toBe(secondRuleId);
  });

  it("records rule creation and activation audit events", async () => {
    if (skipIfNoRuntime()) return;

    const ruleId = await pricingService.createRule(
      {
        mode: "custom",
        name: "Teste Auditoria",
        baseFare: 5,
        pricePerKm: 2,
        pricePerMinute: 0.5,
        minimumFare: 8,
        isActive: false,
        metadata: { runtime_test: true, commercial_status: "provisional" },
      },
      testProfileId,
    );

    const { data: creationLog } = await supabaseAdmin
      .from("pricing_audit_log")
      .select("*")
      .eq("entity_id", ruleId)
      .eq("action", "rule_created")
      .single();
    expect(creationLog?.performed_by).toBe(testProfileId);

    await pricingService.updateRule(ruleId, { isActive: true }, testProfileId);

    const { data: activationLog } = await supabaseAdmin
      .from("pricing_audit_log")
      .select("*")
      .eq("entity_id", ruleId)
      .eq("action", "rule_activated")
      .single();
    expect(activationLog).toBeDefined();
  });

  it("caches and invalidates persisted rule reads", async () => {
    if (skipIfNoRuntime()) return;

    const first = await pricingService.getRule("ride");
    const second = await pricingService.getRule("ride");
    expect(second.id).toBe(first.id);

    pricingService.clearCache();
    const afterClear = await pricingService.getRule("ride");
    expect(afterClear.id).toBe(first.id);
  });

  it("lists active rules by default and all rules on request", async () => {
    if (skipIfNoRuntime()) return;

    const activeRules = await pricingService.listRules();
    const allRules = await pricingService.listRules(true);

    expect(activeRules.every((rule) => rule.isActive)).toBe(true);
    expect(allRules.length).toBeGreaterThanOrEqual(activeRules.length);
  });
});
