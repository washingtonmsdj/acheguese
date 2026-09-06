/**
 * NetworkService — Operações de Rede/Filiais
 *
 * Read model de brand_hub/branches no browser.
 * Mutações estruturais usam BusinessNetworkRpcService + comandos transacionais
 * server-owned; hierarquia não concede autoridade herdada entre Profiles.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import type { BusinessDataRecord } from '../types';
import { BusinessNetworkRpcService } from './BusinessNetworkRpcService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BranchSummary {
  id: string;
  profile_id: string;
  business_name: string;
  unit_name: string | null;
  slug: string;
  location_id: string;
  location_name: string | null;
  is_headquarters: boolean;
  status: string;
}

export interface BrandHubSummary {
  id: string;
  profile_id: string;
  business_name: string;
  slug: string;
  category: string | null;
  status: string;
  branch_count: number;
}

export interface ConvertToNetworkResult {
  brand_hub_id: string;
  first_branch_id: string;
}

type BranchRow = {
  id: string;
  profile_id: string;
  business_name: string;
  unit_name: string | null;
  slug: string;
  location_id: string;
  is_headquarters: boolean | null;
  status: string;
  location?: { name?: string | null } | null;
};

type BrandHubRow = {
  id: string;
  profile_id: string;
  business_name: string;
  slug: string;
  category: string | null;
  status: string;
};

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (
    columns?: string,
    options?: { count?: 'exact'; head?: boolean },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QuerySingleResult<TRow>>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface NetworkDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const networkDb = supabase as unknown as NetworkDbClient;

// ─── Service ──────────────────────────────────────────────────────────────────

export class NetworkService {
  private static readDb(): NetworkDbClient {
    return networkDb;
  }


  /**
   * Busca um brand_hub pelo profile_id.
   */
  static async getBrandHub(profileId: string): Promise<BusinessDataRecord | null> {
    try {
      const { data, error } = await this.readDb()
        .from('business_data')
        .select('*')
        .eq('profile_id', profileId)
        .eq('business_role', 'brand_hub')
        .maybeSingle();

      if (error) throw error;
      return data as BusinessDataRecord | null;
    } catch (err) {
      logger.error('[NetworkService] getBrandHub error:', err);
      return null;
    }
  }

  /**
   * Lista todas as filiais de uma marca (brand_hub).
   */
  static async getBrandBranches(brandHubId: string): Promise<BranchSummary[]> {
    try {
      const { data, error } = await this.readDb()
        .from('business_data')
        .select(`
          id,
          profile_id,
          business_name,
          unit_name,
          slug,
          location_id,
          is_headquarters,
          status,
          location:locations!location_id(name)
        `)
        .eq('parent_business_id', brandHubId)
        .eq('business_role', 'branch')
        .order('is_headquarters', { ascending: false })
        .order('business_name', { ascending: true });

      if (error) throw error;

      return ((data || []) as BranchRow[]).map((row) => ({
        id: row.id,
        profile_id: row.profile_id,
        business_name: row.business_name,
        unit_name: row.unit_name,
        slug: row.slug,
        location_id: row.location_id,
        location_name: row.location?.name ?? null,
        is_headquarters: row.is_headquarters ?? false,
        status: row.status,
      }));
    } catch (err) {
      logger.error('[NetworkService] getBrandBranches error:', err);
      return [];
    }
  }

  /**
   * Converte uma empresa standalone em rede:
   * 1. Cria o brand_hub (sem location_id, sem parent)
   * 2. Converte o standalone em branch (com parent = brand_hub)
   * 3. Marca como headquarters
   *
   * Tudo em sequência com validação. Não usa transação (PostgREST não suporta).
   */
  static async convertToNetwork(
    standaloneProfileId: string,
    brandName: string,
    unitName: string,
  ): Promise<ConvertToNetworkResult> {
    return BusinessNetworkRpcService.convertToNetwork({
      standaloneProfileId,
      brandName,
      unitName,
    });
  }

  static async createBranch(params: {
    brandHubId: string;
    businessName: string;
    unitName: string;
    slug: string;
    locationId: string;
    isHeadquarters?: boolean;
  }): Promise<BusinessDataRecord> {
    const result = await BusinessNetworkRpcService.createBranch(params);
    const { data, error } = await this.readDb()
      .from<BusinessDataRecord>('business_data')
      .select('*')
      .eq('id', result.branch_id)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Filial criada, mas a leitura do registro falhou: ${error?.message ?? 'dados não retornados'}`,
      );
    }

    return data;
  }

  /**
   * Define uma filial como headquarters (matriz).
   * Remove headquarters anterior se existir.
   */
  static async setHeadquarters(
    branchId: string,
    brandHubId: string,
  ): Promise<void> {
    await BusinessNetworkRpcService.setHeadquarters(brandHubId, branchId);
  }

  /**
   * Busca o brand_hub pai de uma branch.
   */
  static async getParentBrandHub(parentBusinessId: string): Promise<BusinessDataRecord | null> {
    try {
      const { data, error } = await this.readDb()
        .from<BusinessDataRecord>('business_data')
        .select('*')
        .eq('id', parentBusinessId)
        .eq('business_role', 'brand_hub')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('[NetworkService] getParentBrandHub error:', err);
      return null;
    }
  }

  /**
   * Lista todas as marcas (brand_hubs) de um profile.
   */
  static async getProfileBrandHubs(profileId: string): Promise<BrandHubSummary[]> {
    try {
      const { data, error } = await this.readDb()
        .from<BrandHubRow>('business_data')
        .select('id, profile_id, business_name, slug, category, status')
        .eq('profile_id', profileId)
        .eq('business_role', 'brand_hub')
        .eq('status', EntityStatus.ACTIVE);

      if (error) throw error;

      const hubs = data || [];

      // Contar filiais para cada hub
      const withCounts = await Promise.all(
        ((hubs || []) as BrandHubRow[]).map(async (hub) => {
          const { count } = await this.readDb()
            .from<{ id: string }>('business_data')
            .select('id', { count: 'exact', head: true })
            .eq('parent_business_id', hub.id)
            .eq('business_role', 'branch');

          return { ...hub, branch_count: count ?? 0 };
        }),
      );

      return withCounts;
    } catch (err) {
      logger.error('[NetworkService] getProfileBrandHubs error:', err);
      return [];
    }
  }
}

