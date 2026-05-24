/**
 * Script de migração: professional_data (legado) → modelo canônico
 *
 * Estratégia:
 * 1. Preservar location_id válido existente
 * 2. Resolver location_id por cidade/bairro de metadata.location quando ausente
 * 3. Criar address_id apenas quando houver endereço físico suficiente
 * 4. Reaproveitar latitude/longitude válidos de metadata.location
 *
 * Segurança:
 * - Não inventa dados
 * - Não chuta ambiguidades
 * - Mantém metadata.location intacto
 * - Gera relatório detalhado
 */

import { supabase } from '@/integrations/supabase';
import { AddressService } from '@/core/address/services/AddressService';
import type { CreateAddressInput } from '@/core/address/types';

const addressService = new AddressService();

interface ImportedProfessional {
  id: string;
  profile_id: string;
  professional_name: string;
  location_id: string | null;
  address_id: string | null;
  metadata: {
    location?: {
      address?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      cep?: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

export interface MigrationResult {
  total: number;
  location_id_already_valid: number;
  location_id_resolved: number;
  address_id_created: number;
  no_physical_address: number;
  coordinates_reused: number;
  failed_no_city: number;
  failed_no_neighborhood: number;
  failed_ambiguous: number;
  failed_no_minimum_data: number;
  failed_other: number;
  skipped_already_migrated: number;
  failures: Array<{
    professional_id: string;
    professional_name: string;
    reason: string;
    data: {
      city?: string;
      neighborhood?: string;
      address?: string;
      location_id?: string;
    };
  }>;
}

export async function migrateProfessionalDataToCanonical(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    location_id_already_valid: 0,
    location_id_resolved: 0,
    address_id_created: 0,
    no_physical_address: 0,
    coordinates_reused: 0,
    failed_no_city: 0,
    failed_no_neighborhood: 0,
    failed_ambiguous: 0,
    failed_no_minimum_data: 0,
    failed_other: 0,
    skipped_already_migrated: 0,
    failures: [],
  };

  // Buscar todos os profissionais
  const { data: professionals, error } = await supabase
    .from('professional_data')
    .select('*')
    .order('created_at');

  if (error) {
    throw new Error(`Failed to fetch professionals: ${error.message}`);
  }

  if (!professionals || professionals.length === 0) {
    return result;
  }

  result.total = professionals.length;

  // Migrar cada profissional
  for (const professional of professionals as ImportedProfessional[]) {
    try {
      await migrateProfessional(professional, result);
    } catch (error) {
      result.failed_other++;
      result.failures.push({
        professional_id: professional.id,
        professional_name: professional.professional_name || 'N/A',
        reason: error instanceof Error ? error.message : 'Unknown error',
        data: {
          address: professional.metadata?.location?.address,
          location_id: professional.location_id ?? undefined,
        },
      });
    }
  }

  return result;
}

async function migrateProfessional(
  professional: ImportedProfessional,
  result: MigrationResult
): Promise<void> {
  // Skip se já migrado completamente
  if (professional.address_id && professional.location_id) {
    result.skipped_already_migrated++;
    return;
  }

  let resolvedLocationId = professional.location_id;

  // 1. Resolver location_id se ausente
  if (!resolvedLocationId) {
    const location = professional.metadata?.location;
    const city = location?.city;
    const neighborhood = location?.neighborhood;

    if (!city) {
      result.failed_no_minimum_data++;
      result.failures.push({
        professional_id: professional.id,
        professional_name: professional.professional_name || 'N/A',
        reason: 'Missing city data',
        data: {
          address: location?.address,
        },
      });
      return;
    }

    // Resolver cidade
    const cityId = await resolveCityByName(city);
    if (!cityId) {
      result.failed_no_city++;
      result.failures.push({
        professional_id: professional.id,
        professional_name: professional.professional_name || 'N/A',
        reason: 'City not found',
        data: {
          city,
          neighborhood,
        },
      });
      return;
    }

    // Resolver bairro se disponível
    if (neighborhood) {
      const districtId = await resolveDistrictByName(neighborhood, cityId);
      if (districtId) {
        resolvedLocationId = districtId;
        result.location_id_resolved++;
      } else {
        // Sem bairro, usar cidade como location_id
        resolvedLocationId = cityId;
        result.location_id_resolved++;
      }
    } else {
      // Sem bairro, usar cidade
      resolvedLocationId = cityId;
      result.location_id_resolved++;
    }
  } else {
    // Validar que location_id existente é válido
    const isValid = await validateLocationId(resolvedLocationId);
    if (isValid) {
      result.location_id_already_valid++;
    } else {
      result.failed_other++;
      result.failures.push({
        professional_id: professional.id,
        professional_name: professional.professional_name || 'N/A',
        reason: 'Invalid existing location_id',
        data: {
          location_id: resolvedLocationId,
        },
      });
      return;
    }
  }

  // 2. Criar address_id apenas se houver endereço físico suficiente
  let addressId: string | null = null;

  if (hasPhysicalAddress(professional)) {
    const location = professional.metadata?.location;

    const addressInput: CreateAddressInput = {
      location_id: resolvedLocationId,
      street: location?.address || undefined,
      postal_code: location?.cep || undefined,
      address_type: determineAddressType(professional),
      geocoding_source: 'migration_import',
      geocoding_confidence: 0.7,
    };

    // Reaproveitar coordenadas válidas
    if (isValidCoordinate(location?.latitude, location?.longitude)) {
      addressInput.latitude = location!.latitude;
      addressInput.longitude = location!.longitude;
      result.coordinates_reused++;
    }

    const address = await addressService.createAddress(addressInput);
    addressId = address.id;
    result.address_id_created++;
  } else {
    result.no_physical_address++;
  }

  // 3. Atualizar professional_data
  const updateData: any = {
    location_id: resolvedLocationId,
  };

  if (addressId) {
    updateData.address_id = addressId;
  }

  const { error: updateError } = await supabase
    .from('professional_data')
    .update(updateData)
    .eq('id', professional.id);

  if (updateError) {
    throw new Error(`Failed to update professional: ${updateError.message}`);
  }
}

async function resolveCityByName(cityName: string): Promise<string | null> {
  const normalized = normalizeText(cityName);

  const { data: cities, error } = await supabase
    .from('locations')
    .select('id, name, slug')
    .eq('type', 'city')
    .eq('status', 'active');

  if (error || !cities) return null;

  const matches = cities.filter((city: any) =>
    normalizeText(city.name) === normalized ||
    normalizeText(city.slug) === normalized
  );

  if (matches.length === 1) return matches[0].id;

  // Se múltiplas, tentar aliases
  if (matches.length === 0) {
    const { data: aliases } = await supabase
      .from('location_aliases')
      .select('location_id')
      .ilike('alias_value', normalized);

    if (aliases && aliases.length === 1) {
      return aliases[0].location_id;
    }
  }

  return null;
}

async function resolveDistrictByName(districtName: string, cityId: string): Promise<string | null> {
  const normalized = normalizeText(districtName);

  const { data: districts, error } = await supabase
    .from('locations')
    .select('id, name, slug')
    .eq('type', 'district')
    .eq('parent_id', cityId)
    .eq('status', 'active');

  if (error || !districts) return null;

  const matches = districts.filter((district: any) =>
    normalizeText(district.name) === normalized ||
    normalizeText(district.slug) === normalized
  );

  if (matches.length === 1) return matches[0].id;

  // Tentar aliases
  if (matches.length === 0) {
    const { data: aliases } = await supabase
      .from('location_aliases')
      .select('location_id')
      .ilike('alias_value', normalized);

    if (aliases && aliases.length === 1) {
      const { data: location } = await supabase
        .from('locations')
        .select('id, parent_id')
        .eq('id', aliases[0].location_id)
        .eq('type', 'district')
        .eq('parent_id', cityId)
        .maybeSingle();

      return location?.id ?? null;
    }
  }

  return null;
}

async function validateLocationId(locationId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, type, status')
    .eq('id', locationId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return false;

  // Validar que não é territorial_group
  if (data.type === 'territorial_group') return false;

  return true;
}

function hasPhysicalAddress(professional: ImportedProfessional): boolean {
  const location = professional.metadata?.location;
  const address = location?.address?.trim() || '';

  // Tem endereço físico se address tem conteúdo utilizável
  return address.length > 5;
}

function determineAddressType(professional: ImportedProfessional): 'exact' | 'approximate' | 'landmark' {
  const location = professional.metadata?.location;
  const address = location?.address?.trim() || '';

  // Se tem número na string, considerar exact
  if (/\d+/.test(address) && address.length > 10) {
    return 'exact';
  }

  // Se tem endereço mas sem número claro, approximate
  if (address.length > 5) {
    return 'approximate';
  }

  return 'landmark';
}

function isValidCoordinate(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat === null || lat === undefined) return false;
  if (lng === null || lng === undefined) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gerar relatório formatado da migração
 */
export function formatMigrationReport(result: MigrationResult): string {
  const lines: string[] = [];

  lines.push('# RELATÓRIO DE MIGRAÇÃO - professional_data');
  lines.push('');
  lines.push(`Total de profissionais: ${result.total}`);
  lines.push(`location_id já válido: ${result.location_id_already_valid}`);
  lines.push(`location_id resolvido: ${result.location_id_resolved}`);
  lines.push(`address_id criado: ${result.address_id_created}`);
  lines.push(`Sem endereço físico: ${result.no_physical_address}`);
  lines.push(`Coordenadas reaproveitadas: ${result.coordinates_reused}`);
  lines.push(`Já migrados (skip): ${result.skipped_already_migrated}`);
  lines.push('');
  lines.push('## Falhas');
  lines.push(`Cidade não encontrada: ${result.failed_no_city}`);
  lines.push(`Bairro não encontrado: ${result.failed_no_neighborhood}`);
  lines.push(`Ambíguas: ${result.failed_ambiguous}`);
  lines.push(`Dados mínimos ausentes: ${result.failed_no_minimum_data}`);
  lines.push(`Outros erros: ${result.failed_other}`);
  lines.push('');

  if (result.failures.length > 0) {
    lines.push('## Exemplos de Falhas (primeiros 10)');
    lines.push('');
    result.failures.slice(0, 10).forEach((failure, index) => {
      lines.push(`${index + 1}. ${failure.professional_name} (ID: ${failure.professional_id})`);
      lines.push(`   Razão: ${failure.reason}`);
      lines.push(`   Cidade: ${failure.data.city || 'N/A'}`);
      lines.push(`   Bairro: ${failure.data.neighborhood || 'N/A'}`);
      lines.push(`   Endereço: ${failure.data.address || 'N/A'}`);
      lines.push('');
    });
  }

  lines.push('## Taxa de Sucesso');
  const successCount = result.location_id_already_valid + result.location_id_resolved;
  const successRate = result.total > 0
    ? ((successCount / result.total) * 100).toFixed(2)
    : '0.00';
  lines.push(`${successRate}% (${successCount}/${result.total})`);
  lines.push('');
  lines.push('## Endereços Físicos');
  const addressRate = result.total > 0
    ? ((result.address_id_created / result.total) * 100).toFixed(2)
    : '0.00';
  lines.push(`${addressRate}% com endereço físico (${result.address_id_created}/${result.total})`);

  return lines.join('\n');
}
