/**
 * Script de migração: user_residences (legado) → modelo canônico
 *
 * Estratégia:
 * 1. Resolver cidade por texto
 * 2. Resolver bairro por texto dentro da cidade
 * 3. Criar address canônico
 * 4. Atualizar user_residence com address_id + location_id
 *
 * Segurança:
 * - Não inventa dados
 * - Não chuta ambiguidades
 * - Mantém campos legados intactos
 * - Gera relatório detalhado
 */

import { supabase } from '@/integrations/supabase';
import { AddressService } from '@/core/address/services/AddressService';
import type { CreateAddressInput } from '@/core/address/types';

const addressService = new AddressService();

interface ImportedResidence {
  id: string;
  user_id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_id: string | null;
  location_id: string | null;
}

export interface MigrationResult {
  total: number;
  migrated: number;
  skipped_already_migrated: number;
  failed_no_city: number;
  failed_no_neighborhood: number;
  failed_ambiguous: number;
  failed_no_minimum_data: number;
  failed_other: number;
  failures: Array<{
    residence_id: string;
    reason: string;
    data: {
      city?: string;
      neighborhood?: string;
      street?: string;
    };
  }>;
}

export async function migrateUserResidencesToCanonical(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped_already_migrated: 0,
    failed_no_city: 0,
    failed_no_neighborhood: 0,
    failed_ambiguous: 0,
    failed_no_minimum_data: 0,
    failed_other: 0,
    failures: [],
  };

  // Buscar todas as residências
  const { data: residences, error } = await supabase
    .from('user_residences')
    .select('*')
    .order('created_at');

  if (error) {
    throw new Error(`Failed to fetch residences: ${error.message}`);
  }

  if (!residences || residences.length === 0) {
    return result;
  }

  result.total = residences.length;

  // Migrar cada residência
  for (const residence of (residences as unknown as ImportedResidence[])) {
    // Skip se já migrado
    if (residence.address_id && residence.location_id) {
      result.skipped_already_migrated++;
      continue;
    }

    try {
      await migrateResidence(residence, result);
    } catch (error) {
      result.failed_other++;
      result.failures.push({
        residence_id: residence.id,
        reason: error instanceof Error ? error.message : 'Unknown error',
        data: {
          city: residence.city,
          neighborhood: residence.neighborhood,
          street: residence.street,
        },
      });
    }
  }

  return result;
}

async function migrateResidence(
  residence: ImportedResidence,
  result: MigrationResult
): Promise<void> {
  // Validar dados mínimos
  if (!residence.city || !residence.neighborhood) {
    result.failed_no_minimum_data++;
    result.failures.push({
      residence_id: residence.id,
      reason: 'Missing city or neighborhood',
      data: {
        city: residence.city,
        neighborhood: residence.neighborhood,
      },
    });
    return;
  }

  // 1. Resolver cidade
  const cityId = await resolveCityByName(residence.city, residence.state);
  if (!cityId) {
    result.failed_no_city++;
    result.failures.push({
      residence_id: residence.id,
      reason: 'City not found',
      data: {
        city: residence.city,
        neighborhood: residence.neighborhood,
      },
    });
    return;
  }

  // 2. Resolver bairro dentro da cidade
  const districtId = await resolveDistrictByName(residence.neighborhood, cityId);
  if (!districtId) {
    result.failed_no_neighborhood++;
    result.failures.push({
      residence_id: residence.id,
      reason: 'Neighborhood not found',
      data: {
        city: residence.city,
        neighborhood: residence.neighborhood,
      },
    });
    return;
  }

  // 3. Criar address canônico
  const addressInput: CreateAddressInput = {
    location_id: districtId,
    postal_code: residence.postal_code || undefined,
    street: residence.street || undefined,
    number: residence.number || undefined,
    complement: residence.complement || undefined,
    address_type: determineAddressType(residence),
    geocoding_source: 'migration_import',
    geocoding_confidence: 0.7, // Migração de dados legados
  };

  const address = await addressService.createAddress(addressInput);

  // 4. Atualizar user_residence
  const { error: updateError } = await supabase
    .from('user_residences')
    .update({
      address_id: address.id,
      location_id: districtId,
    })
    .eq('id', residence.id);

  if (updateError) {
    throw new Error(`Failed to update residence: ${updateError.message}`);
  }

  result.migrated++;
}

async function resolveCityByName(cityName: string, stateName: string): Promise<string | null> {
  const normalized = normalizeText(cityName);

  // Buscar cidade por nome normalizado
  const { data: cities, error } = await supabase
    .from('locations')
    .select('id, name, slug, parent_id')
    .eq('type', 'city')
    .eq('status', 'active');

  if (error || !cities) return null;

  // Filtrar por nome normalizado
  const matches = cities.filter((city: any) =>
    normalizeText(city.name) === normalized
  );

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0].id;

  // Se múltiplas cidades com mesmo nome, tentar filtrar por estado
  const stateNormalized = normalizeText(stateName);

  for (const city of matches) {
    if (!city.parent_id) continue;

    const { data: state } = await supabase
      .from('locations')
      .select('name, slug')
      .eq('id', city.parent_id)
      .eq('type', 'state')
      .maybeSingle();

    if (state && (
      normalizeText(state.name) === stateNormalized ||
      normalizeText(state.slug) === stateNormalized
    )) {
      return city.id;
    }
  }

  // Ambíguo
  return null;
}

async function resolveDistrictByName(districtName: string, cityId: string): Promise<string | null> {
  const normalized = normalizeText(districtName);

  // Buscar bairro por nome dentro da cidade
  const { data: districts, error } = await supabase
    .from('locations')
    .select('id, name, slug')
    .eq('type', 'district')
    .eq('parent_id', cityId)
    .eq('status', 'active');

  if (error || !districts) return null;

  // Filtrar por nome normalizado
  const matches = districts.filter((district: any) =>
    normalizeText(district.name) === normalized ||
    normalizeText(district.slug) === normalized
  );

  if (matches.length === 0) {
    // Tentar buscar por alias
    const { data: aliases } = await supabase
      .from('location_aliases')
      .select('location_id')
      .ilike('alias_value', normalized);

    if (aliases && aliases.length === 1) {
      // Validar que o alias aponta para district da cidade correta
      const { data: location } = await supabase
        .from('locations')
        .select('id, parent_id')
        .eq('id', aliases[0].location_id)
        .eq('type', 'district')
        .eq('parent_id', cityId)
        .maybeSingle();

      return location?.id ?? null;
    }

    return null;
  }

  if (matches.length === 1) return matches[0].id;

  // Ambíguo (múltiplos bairros com mesmo nome na mesma cidade)
  return null;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

function determineAddressType(residence: ImportedResidence): 'exact' | 'approximate' | 'landmark' {
  // Se tem rua e número, é exact
  if (residence.street && residence.street.trim() !== '' &&
      residence.number && residence.number.trim() !== '') {
    return 'exact';
  }

  // Se tem rua mas não tem número, é approximate
  if (residence.street && residence.street.trim() !== '') {
    return 'approximate';
  }

  // Caso contrário, é landmark (apenas bairro)
  return 'landmark';
}

/**
 * Gerar relatório formatado da migração
 */
export function formatMigrationReport(result: MigrationResult): string {
  const lines: string[] = [];

  lines.push('# RELATÓRIO DE MIGRAÇÃO - user_residences');
  lines.push('');
  lines.push(`Total de residências: ${result.total}`);
  lines.push(`Migradas com sucesso: ${result.migrated}`);
  lines.push(`Já migradas (skip): ${result.skipped_already_migrated}`);
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
      lines.push(`${index + 1}. ID: ${failure.residence_id}`);
      lines.push(`   Razão: ${failure.reason}`);
      lines.push(`   Cidade: ${failure.data.city || 'N/A'}`);
      lines.push(`   Bairro: ${failure.data.neighborhood || 'N/A'}`);
      lines.push(`   Rua: ${failure.data.street || 'N/A'}`);
      lines.push('');
    });
  }

  lines.push('## Taxa de Sucesso');
  const successRate = result.total > 0
    ? ((result.migrated / result.total) * 100).toFixed(2)
    : '0.00';
  lines.push(`${successRate}% (${result.migrated}/${result.total})`);

  return lines.join('\n');
}
