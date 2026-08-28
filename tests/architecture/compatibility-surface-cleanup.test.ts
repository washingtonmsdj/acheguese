import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');
const exists = (path: string) => existsSync(resolve(repoRoot, path));

describe('compatibility surface cleanup', () => {
  it('keeps community alerts canonical and removes completed Events migration allowlists', () => {
    const communityValidator = read(
      'tools/architecture/validate-community-transversal-boundaries.ts',
    );
    const taxonomyValidator = read(
      'tools/architecture/validate-project-taxonomy.ts',
    );

    expect(exists('src/modules/community-alerts')).toBe(false);
    expect(communityValidator).not.toContain('CORE_COMMUNITY_IMPORT_ALLOWLIST');
    expect(communityValidator).not.toContain('LEGACY_TRANSVERSAL_MIGRATION_ROOTS');
    expect(exists('src/features')).toBe(false);
    expect(taxonomyValidator).not.toContain('DEPRECATED_COMPAT_MODULE_ROOTS');
    expect(taxonomyValidator).not.toContain('CORE_TO_MODULE_IMPORT_ALLOWLIST');
    expect(taxonomyValidator).toContain('"community-alerts",');
  });

  it('keeps Event engagement persistence on the canonical community-events core owner', () => {
    const canonical = read(
      'src/core/community-events/services/EventEngagementService.ts',
    );

    expect(exists('src/core/verticals/events')).toBe(false);
    expect(canonical).toContain('from "@/integrations/supabase"');
    expect(canonical).toContain('export class EventEngagementService');
    expect(
      exists('src/modules/community-events/services/EventEngagementService.ts'),
    ).toBe(false);
  });

  it('removes deprecated APIs and unconsumed duplicate types', () => {
    const paymentMethods = read('src/core/business/constants/paymentMethods.ts');
    const residentAddress = read(
      'src/core/address/services/ResidentAddressService.ts',
    );
    const createExtras = read(
      'src/modules/business/components/create/ExtrasStep.tsx',
    );
    const editExtras = read('src/modules/business/components/edit/ExtrasStep.tsx');

    for (const removedName of [
      'getPaymentMethodLabels',
      'getPaymentMethodIcon',
      'getPaymentMethodColor',
      'labelsToIds',
      'idsToLabels',
    ]) {
      expect(paymentMethods).not.toContain(removedName);
    }

    expect(residentAddress).not.toContain('async lookupCep(');
    expect(exists('src/modules/classifieds/types/classified.ts')).toBe(false);
    expect(createExtras).toContain('PAYMENT_METHODS.map');
    expect(editExtras).toContain('PAYMENT_METHODS.map');
  });

  it('does not expose a simulated SSOT plan generator as an operational command', () => {
    const packageJson = read('package.json');

    expect(exists('scripts/generate-ssot-fix-plan.ts')).toBe(false);
    expect(packageJson).not.toContain('plan:ssot-fix');
  });

  it('models final grant state without a mutating RPC exception list', () => {
    const validator = read('tools/migrations/validate-supabase-migrations.ts');

    expect(validator).not.toContain('EXPOSED_MUTATING_RPC_ALLOWLIST');
    expect(validator).toContain('revokeExecuteRegex');
    expect(validator).toContain("functionEvents.sort");
    expect(validator).toContain('principals: new Set(["public"])');
  });
});
