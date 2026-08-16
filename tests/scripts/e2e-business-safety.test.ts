import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertIsolatedBusinessMutationTarget,
  hasIsolatedBusinessMutationTarget,
  technicalBusinessMetadata,
} from "../../scripts/lib/e2e-business-safety";

const ENV_KEYS = [
  "E2E_BUSINESS_TARGET",
  "E2E_BUSINESS_MUTATION_APPROVED",
  "VERCEL_ENV",
  "PLAYWRIGHT_BASE_URL",
  "VITE_PUBLIC_APP_URL",
  "SUPABASE_URL",
  "VITE_SUPABASE_URL",
] as const;

const originalEnv = new Map<string, string | undefined>();

function linkedProductionProjectRef(): string {
  const config = readFileSync(resolve(process.cwd(), "supabase/config.toml"), "utf8");
  const projectRef = config.match(/^project_id\s*=\s*["']([^"']+)["']/m)?.[1]?.trim();
  if (!projectRef) throw new Error("project_id ausente em supabase/config.toml");
  return projectRef;
}

function approveIsolatedTarget(url?: string) {
  process.env.E2E_BUSINESS_TARGET = "isolated";
  process.env.E2E_BUSINESS_MUTATION_APPROVED = "true";
  if (url) process.env.SUPABASE_URL = url;
}

describe("Business E2E mutation safety", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    originalEnv.clear();
  });

  it("bloqueia por padrao sem opt-in explicito", () => {
    expect(hasIsolatedBusinessMutationTarget()).toBe(false);
    expect(() => assertIsolatedBusinessMutationTarget("test-op")).toThrow(/bloqueada/);
  });

  it("bloqueia quando o Supabase alvo nao pode ser provado", () => {
    approveIsolatedTarget();
    expect(hasIsolatedBusinessMutationTarget()).toBe(false);
  });

  it("bloqueia o projeto Supabase Production vinculado mesmo com opt-in", () => {
    const projectRef = linkedProductionProjectRef();
    approveIsolatedTarget(`https://${projectRef}.supabase.co`);

    expect(hasIsolatedBusinessMutationTarget()).toBe(false);
    expect(() => assertIsolatedBusinessMutationTarget("test-op")).toThrow(/Production/);
  });

  it("bloqueia quando a aplicacao alvo e Production", () => {
    approveIsolatedTarget("https://isolated-business-fixture.supabase.co");
    process.env.PLAYWRIGHT_BASE_URL = "https://acheguese.com.br";

    expect(hasIsolatedBusinessMutationTarget()).toBe(false);
  });

  it("permite somente projeto Supabase remoto diferente do Production vinculado", () => {
    approveIsolatedTarget("https://isolated-business-fixture.supabase.co");

    expect(hasIsolatedBusinessMutationTarget()).toBe(true);
    expect(() => assertIsolatedBusinessMutationTarget("test-op")).not.toThrow();
  });

  it("marca fixtures com provenance tecnica explicita", () => {
    expect(technicalBusinessMetadata()).toEqual({
      source: "e2e",
      source_kind: "technical_fixture",
    });
  });
});
