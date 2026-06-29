/**
 * NetworkService — Operações de Rede/Filiais
 *
 * Gerencia brand_hub, branches e conversão standalone → rede.
 * Não cria migrations. Usa apenas as colunas já existentes no banco.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import type { BusinessDataRecord } from '../types';
import { EntityStatus } from '@/shared/types/enums';

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
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  delete: () => QueryBuilder<TRow>;
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
  private static adminDb(): NetworkDbClient {
    return networkDb;
  }


  /**
   * Busca um brand_hub pelo profile_id.
   */
  static async getBrandHub(profileId: string): Promise<BusinessDataRecord | null> {
    try {
      const { data, error } = await this.adminDb()
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
      const { data, error } = await this.adminDb()
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
    // 1. Buscar standalone e o user_id do perfil
    const { data: standalone, error: fetchErr } = await this.adminDb()
      .from<BusinessDataRecord>('business_data')
      .select('*')
      .eq('profile_id', standaloneProfileId)
      .eq('business_role', 'standalone')
      .maybeSingle();

    if (fetchErr || !standalone) {
      throw new Error('Empresa standalone não encontrada ou já convertida.');
    }

    // ✅ SSOT - Buscar o user_id do perfil da empresa via ProfileService
    const { profileService } = await import('@/core/profiles');
    const profileData = await profileService.getProfileById(standaloneProfileId);

    if (!profileData?.user_id) {
      throw new Error('Perfil da empresa não encontrado ou sem user_id.');
    }

    const userId = profileData.user_id;

    // ✅ SSOT - Criar um NOVO perfil para o brand_hub via ProfileService
    
    const hubProfile = await profileService.createProfile({
      profile_type: 'business',
      name: brandName,
      username: `${standalone.slug || standaloneProfileId}-rede`,
      city: 'Não informado', // Campo obrigatório
      bio: `Rede ${brandName}`,
    });

    if (!hubProfile) {
      throw new Error('Falha ao criar perfil do brand_hub');
    }

    // 3. Criar brand_hub com o NOVO profile_id
    const hubSlug = `${standalone.slug || standaloneProfileId}-rede`;
    const { data: hub, error: hubErr } = await this.adminDb()
      .from<{ id: string; profile_id: string }>('business_data')
      .insert({
        profile_id: hubProfile.id, // NOVO profile_id
        business_name: brandName,
        slug: hubSlug,
        business_role: 'brand_hub',
        location_id: null, // brand_hub não tem território
        category: standalone.category,
        subcategory: standalone.subcategory,
        description: standalone.description,
        status: EntityStatus.ACTIVE,
        payment_methods: standalone.payment_methods || [],
        specialties: standalone.specialties || [],
        facilities: standalone.facilities || [],
        email: standalone.email,
        website: standalone.website,
        instagram: standalone.instagram,
        facebook: standalone.facebook,
        metadata: standalone.metadata || {},
      })
      .select('id, profile_id')
      .single();

    if (hubErr || !hub) {
      // Rollback: remover perfil criado via ProfileService
      
      await profileService.deleteProfile(hubProfile.id);
      throw new Error(`Falha ao criar brand_hub: ${hubErr?.message}`);
    }

    // 4. Adicionar o usuário como owner do brand_hub
    const { error: memberErr } = await this.adminDb()
      .from<{ id?: string }>('profile_members')
      .insert({
        profile_id: hubProfile.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberErr) {
      // Rollback: remover hub e perfil criados
      await this.adminDb().from('business_data').delete().eq('id', hub.id);
      
      await profileService.deleteProfile(hubProfile.id);
      throw new Error(`Falha ao criar vínculo profile_members: ${memberErr.message}`);
    }

    // 5. Converter standalone → branch (mantém o profile_id original)
    const { error: convertErr } = await this.adminDb()
      .from('business_data')
      .update({
        business_role: 'branch',
        parent_business_id: hub.id,
        is_headquarters: true,
        unit_name: unitName,
      })
      .eq('id', standalone.id);

    if (convertErr) {
      // Rollback: remover hub, perfil e vínculo criados
      await this.adminDb().from('profile_members').delete().eq('profile_id', hubProfile.id);
      await this.adminDb().from('business_data').delete().eq('id', hub.id);
      
      await profileService.deleteProfile(hubProfile.id);
      throw new Error(`Falha ao converter standalone em branch: ${convertErr.message}`);
    }

    return { brand_hub_id: hub.profile_id, first_branch_id: standalone.id };
  }

  /**
   * Cria uma nova filial vinculada a um brand_hub existente.
   */
  static async createBranch(params: {
    brandHubId: string;
    profileId: string;
    businessName: string;
    unitName: string;
    slug: string;
    locationId: string;
    isHeadquarters?: boolean;
  }): Promise<BusinessDataRecord> {
    // Validar que brand_hub existe
    const { data: hub, error: hubErr } = await this.adminDb()
      .from<BusinessDataRecord>('business_data')
      .select('id, category, subcategory, payment_methods, specialties, facilities, email, metadata')
      .eq('id', params.brandHubId)
      .eq('business_role', 'brand_hub')
      .maybeSingle();

    if (hubErr || !hub) {
      throw new Error('brand_hub não encontrado.');
    }

    // Se isHeadquarters, garantir que não existe outra headquarters
    if (params.isHeadquarters) {
      const { data: existing } = await this.adminDb()
        .from<{ id: string }>('business_data')
        .select('id')
        .eq('parent_business_id', params.brandHubId)
        .eq('is_headquarters', true)
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe uma filial matriz para esta marca.');
      }
    }

    const { data: branch, error: branchErr } = await this.adminDb()
      .from<BusinessDataRecord>('business_data')
      .insert({
        profile_id: params.profileId,
        business_name: params.businessName,
        unit_name: params.unitName,
        slug: params.slug,
        business_role: 'branch',
        parent_business_id: params.brandHubId,
        location_id: params.locationId,
        is_headquarters: params.isHeadquarters ?? false,
        category: hub.category,
        subcategory: hub.subcategory,
        status: EntityStatus.ACTIVE,
        payment_methods: hub.payment_methods || [],
        specialties: hub.specialties || [],
        facilities: hub.facilities || [],
        email: hub.email,
        metadata: hub.metadata || {},
      })
      .select('*')
      .maybeSingle();

    if (branchErr || !branch) {
      throw new Error(`Falha ao criar filial: ${branchErr?.message ?? 'dados não retornados'}`);
    }

    return branch as BusinessDataRecord;
  }

  /**
   * Define uma filial como headquarters (matriz).
   * Remove headquarters anterior se existir.
   */
  static async setHeadquarters(branchId: string, brandHubId: string): Promise<void> {
    // Remover headquarters atual
    const { error: clearErr } = await this.adminDb()
      .from('business_data')
      .update({ is_headquarters: false })
      .eq('parent_business_id', brandHubId)
      .eq('is_headquarters', true);

    if (clearErr) throw new Error(`Falha ao limpar headquarters: ${clearErr.message}`);

    // Definir nova headquarters
    const { error: setErr } = await this.adminDb()
      .from('business_data')
      .update({ is_headquarters: true })
      .eq('id', branchId)
      .eq('business_role', 'branch');

    if (setErr) throw new Error(`Falha ao definir headquarters: ${setErr.message}`);
  }

  /**
   * Busca o brand_hub pai de uma branch.
   */
  static async getParentBrandHub(parentBusinessId: string): Promise<BusinessDataRecord | null> {
    try {
      const { data, error } = await this.adminDb()
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
      const { data, error } = await this.adminDb()
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
          const { count } = await this.adminDb()
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

