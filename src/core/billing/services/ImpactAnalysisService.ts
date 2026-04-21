/**
 * Impact Analysis Service
 * 
 * Analyzes the impact of catalog changes on active contracts.
 * Provides revenue projections and migration complexity assessment.
 * 
 * @see F5_ADMIN_MONETIZATION.md
 * @see F1_1_SANEAMENTO_MODELAGEM.md
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ImpactAnalysisResult,
  BulkImpactAnalysisResult,
} from '../types/admin.types';

export class ImpactAnalysisService {
  /**
   * Analyze impact of a catalog item change
   * 
   * Calculates:
   * - Number of affected contracts/users/businesses
   * - Revenue impact (MRR delta)
   * - Migration complexity
   */
  static async analyzeItemImpact(itemId: string): Promise<ImpactAnalysisResult> {
    // Fetch item details
    const { data: item, error: itemError } = await supabase
      .from('catalog_item')
      .select(`
        id,
        item_code,
        display_name,
        catalog_version_id,
        catalog_pricing_policy(price_cents)
      `)
      .eq('id', itemId)
      .single();

    if (itemError) {
      throw new Error(`Failed to fetch item: ${itemError.message}`);
    }

    const currentPriceCents = (item as any).catalog_pricing_policy?.price_cents || 0;

    // Find contracts using this catalog version
    const { data: contracts, error: contractsError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        business_id,
        subscription_scope,
        status_v2,
        price_cents,
        contract_snapshot
      `)
      .eq('catalog_version_id', item.catalog_version_id)
      .in('status_v2', ['active', 'trialing']);

    if (contractsError) {
      throw new Error(`Failed to fetch contracts: ${contractsError.message}`);
    }

    // Filter contracts that use this specific item
    const affectedContracts = (contracts || []).filter(contract => {
      const snapshot = contract.contract_snapshot as any;
      return snapshot?.base_plan_code === item.item_code ||
             snapshot?.vertical_packages?.includes(item.item_code) ||
             snapshot?.addons?.includes(item.item_code);
    });

    // Calculate unique users and businesses
    const uniqueUsers = new Set(affectedContracts.map(c => c.user_id)).size;
    const uniqueBusinesses = new Set(
      affectedContracts.filter(c => c.business_id).map(c => c.business_id)
    ).size;

    // Calculate MRR (Monthly Recurring Revenue)
    const currentMrrCents = affectedContracts.reduce((sum, contract) => {
      return sum + (contract.price_cents || 0);
    }, 0);

    // For now, projected MRR is same as current (no price change assumed)
    // In a real scenario, this would calculate based on proposed changes
    const projectedMrrCents = currentMrrCents;
    const mrrDeltaCents = projectedMrrCents - currentMrrCents;
    const mrrDeltaPercentage = currentMrrCents > 0
      ? (mrrDeltaCents / currentMrrCents) * 100
      : 0;

    // Breakdown by status
    const contractsByStatus: Record<string, number> = {};
    affectedContracts.forEach(contract => {
      contractsByStatus[contract.status_v2] = (contractsByStatus[contract.status_v2] || 0) + 1;
    });

    // Breakdown by scope
    const contractsByScope: Record<string, number> = {};
    affectedContracts.forEach(contract => {
      contractsByScope[contract.subscription_scope] = (contractsByScope[contract.subscription_scope] || 0) + 1;
    });

    // Assess migration complexity
    const requiresMigration = affectedContracts.length > 0;
    let migrationComplexity: 'low' | 'medium' | 'high' = 'low';
    const migrationNotes: string[] = [];

    if (affectedContracts.length === 0) {
      migrationComplexity = 'low';
      migrationNotes.push('No active contracts affected');
    } else if (affectedContracts.length < 10) {
      migrationComplexity = 'low';
      migrationNotes.push(`Only ${affectedContracts.length} contracts affected`);
    } else if (affectedContracts.length < 100) {
      migrationComplexity = 'medium';
      migrationNotes.push(`${affectedContracts.length} contracts require migration`);
      migrationNotes.push('Consider phased rollout');
    } else {
      migrationComplexity = 'high';
      migrationNotes.push(`${affectedContracts.length} contracts require migration`);
      migrationNotes.push('Requires careful planning and phased rollout');
      migrationNotes.push('Consider communication plan for affected users');
    }

    if (mrrDeltaCents !== 0) {
      const mrrChange = mrrDeltaCents > 0 ? 'increase' : 'decrease';
      migrationNotes.push(`Revenue ${mrrChange} of R$ ${Math.abs(mrrDeltaCents / 100).toFixed(2)}/month`);
    }

    return {
      catalog_item_id: itemId,
      item_code: item.item_code,
      display_name: item.display_name,
      affected_contracts_count: affectedContracts.length,
      affected_users_count: uniqueUsers,
      affected_businesses_count: uniqueBusinesses,
      current_mrr_cents: currentMrrCents,
      projected_mrr_cents: projectedMrrCents,
      mrr_delta_cents: mrrDeltaCents,
      mrr_delta_percentage: mrrDeltaPercentage,
      contracts_by_status: contractsByStatus,
      contracts_by_scope: contractsByScope,
      requires_migration: requiresMigration,
      migration_complexity: migrationComplexity,
      migration_notes: migrationNotes,
    };
  }

  /**
   * Analyze impact of an entire catalog version
   */
  static async analyzeVersionImpact(versionId: string): Promise<BulkImpactAnalysisResult> {
    // Fetch version details
    const { data: version, error: versionError } = await supabase
      .from('commercial_catalog_version')
      .select('version_number')
      .eq('id', versionId)
      .single();

    if (versionError) {
      throw new Error(`Failed to fetch version: ${versionError.message}`);
    }

    // Fetch all items in version
    const { data: items, error: itemsError } = await supabase
      .from('catalog_item')
      .select('id')
      .eq('catalog_version_id', versionId);

    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }

    // Analyze each item
    const itemAnalyses = await Promise.all(
      (items || []).map(item => this.analyzeItemImpact(item.id))
    );

    // Aggregate results
    const totalAffectedContracts = new Set(
      itemAnalyses.flatMap(a => Array(a.affected_contracts_count).fill(a.catalog_item_id))
    ).size;

    const totalAffectedUsers = itemAnalyses.reduce(
      (sum, a) => sum + a.affected_users_count,
      0
    );

    const totalMrrDeltaCents = itemAnalyses.reduce(
      (sum, a) => sum + a.mrr_delta_cents,
      0
    );

    return {
      version_id: versionId,
      version_number: version.version_number,
      total_affected_contracts: totalAffectedContracts,
      total_affected_users: totalAffectedUsers,
      total_mrr_delta_cents: totalMrrDeltaCents,
      items: itemAnalyses,
    };
  }

  /**
   * Get migration recommendations for a version
   */
  static async getMigrationRecommendations(versionId: string): Promise<{
    can_publish_safely: boolean;
    recommendations: string[];
    warnings: string[];
  }> {
    const impact = await this.analyzeVersionImpact(versionId);

    const recommendations: string[] = [];
    const warnings: string[] = [];
    let canPublishSafely = true;

    // Check total impact
    if (impact.total_affected_contracts === 0) {
      recommendations.push('No active contracts affected. Safe to publish.');
    } else if (impact.total_affected_contracts < 10) {
      recommendations.push('Low impact. Consider direct migration.');
      recommendations.push('Notify affected users before publishing.');
    } else if (impact.total_affected_contracts < 100) {
      recommendations.push('Medium impact. Implement phased rollout.');
      recommendations.push('Create communication plan for affected users.');
      recommendations.push('Monitor metrics closely during rollout.');
      warnings.push(`${impact.total_affected_contracts} contracts will be affected`);
    } else {
      canPublishSafely = false;
      warnings.push(`High impact: ${impact.total_affected_contracts} contracts affected`);
      warnings.push('Requires executive approval and detailed migration plan');
      recommendations.push('Create detailed migration plan with rollback strategy');
      recommendations.push('Implement feature flags for gradual rollout');
      recommendations.push('Set up monitoring and alerting');
      recommendations.push('Prepare customer support team');
    }

    // Check revenue impact
    if (impact.total_mrr_delta_cents !== 0) {
      const mrrChange = impact.total_mrr_delta_cents > 0 ? 'increase' : 'decrease';
      const mrrAmount = Math.abs(impact.total_mrr_delta_cents / 100).toFixed(2);
      
      if (Math.abs(impact.total_mrr_delta_cents) > 100000) { // > R$ 1000/month
        warnings.push(`Significant revenue ${mrrChange}: R$ ${mrrAmount}/month`);
        recommendations.push('Review financial impact with finance team');
      } else {
        recommendations.push(`Expected revenue ${mrrChange}: R$ ${mrrAmount}/month`);
      }
    }

    // Check for high-complexity items
    const highComplexityItems = impact.items.filter(i => i.migration_complexity === 'high');
    if (highComplexityItems.length > 0) {
      warnings.push(`${highComplexityItems.length} items have high migration complexity`);
      recommendations.push('Review high-complexity items individually');
    }

    return {
      can_publish_safely: canPublishSafely,
      recommendations,
      warnings,
    };
  }

  /**
   * Simulate price change impact
   * 
   * Calculates what would happen if a specific item's price changes.
   */
  static async simulatePriceChange(
    itemId: string,
    newPriceCents: number
  ): Promise<ImpactAnalysisResult> {
    const baseImpact = await this.analyzeItemImpact(itemId);

    // Fetch current price
    const { data: pricing, error: pricingError } = await supabase
      .from('catalog_pricing_policy')
      .select('price_cents')
      .eq('catalog_item_id', itemId)
      .single();

    if (pricingError) {
      throw new Error(`Failed to fetch pricing: ${pricingError.message}`);
    }

    const currentPriceCents = pricing.price_cents;
    const priceDeltaCents = newPriceCents - currentPriceCents;

    // Calculate new MRR
    const projectedMrrCents = baseImpact.current_mrr_cents + 
      (baseImpact.affected_contracts_count * priceDeltaCents);
    
    const mrrDeltaCents = projectedMrrCents - baseImpact.current_mrr_cents;
    const mrrDeltaPercentage = baseImpact.current_mrr_cents > 0
      ? (mrrDeltaCents / baseImpact.current_mrr_cents) * 100
      : 0;

    // Update migration notes
    const migrationNotes = [...baseImpact.migration_notes];
    if (priceDeltaCents > 0) {
      migrationNotes.push(`Price increase: R$ ${(priceDeltaCents / 100).toFixed(2)}/month per contract`);
      migrationNotes.push('Consider grandfathering existing customers');
    } else if (priceDeltaCents < 0) {
      migrationNotes.push(`Price decrease: R$ ${Math.abs(priceDeltaCents / 100).toFixed(2)}/month per contract`);
      migrationNotes.push('Existing customers will benefit from lower price');
    }

    return {
      ...baseImpact,
      projected_mrr_cents: projectedMrrCents,
      mrr_delta_cents: mrrDeltaCents,
      mrr_delta_percentage: mrrDeltaPercentage,
      migration_notes: migrationNotes,
    };
  }
}
