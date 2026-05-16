/**
 * ResidentAddressService - Orquestrador SSOT para endereço residencial
 *
 * Fluxo:
 * 1. validar input
 * 2. consultar CEP via camada territorial centralizada
 * 3. normalizar logradouro
 * 4. obter `location_id` reconciliado no SSOT territorial
 * 5. determinar precisão
 * 6. persistir endereço
 * 7. criar/atualizar residência
 *
 * Regra crítica:
 * - cidade/bairro/estado não entram no sistema a partir do provider externo.
 * - o cadastro depende de `locationData` reconciliado contra `locations`.
 */
import { logger } from '@/shared/utils/logger';
import {
  locationGeocodingService,
  type LocationPostalCodeLookupResult,
} from '@/core/location/services/LocationGeocodingService';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { residenceService } from '@/core/residence/services/ResidenceService';
import { AddressService } from './AddressService';
import type {
  Address,
  AddressPrecision,
  AddressPublicDTO,
  RegisterResidentAddressInput,
  RegisterResidentAddressResult,
} from '../types';

export class ResidentAddressService {
  private readonly addressService: AddressService;

  constructor() {
    this.addressService = new AddressService();
  }

  async registerResidentAddress(
    input: RegisterResidentAddressInput,
  ): Promise<RegisterResidentAddressResult> {
    this.validateInput(input);

    const cepData = await locationGeocodingService.lookupPostalCode({
      postalCode: input.postal_code,
    });

    if (!cepData) {
      throw new Error('CEP não encontrado. Verifique e tente novamente.');
    }

    const normalizedStreet = input.street || cepData.street;
    if (!normalizedStreet) {
      throw new Error('Logradouro não identificado. Preencha manualmente.');
    }

    const locationId = input.location_id || (await this.resolveLocationFromCep(cepData));
    if (!locationId) {
      const providerCity = cepData.providerAddress.city ?? 'cidade';
      const providerState = cepData.providerAddress.state ?? 'estado';

      throw new Error(
        `Território não encontrado para ${providerCity}/${providerState}. ` +
          'Esta cidade pode não estar cadastrada no sistema.',
      );
    }

    const locationRepo = createLocationRepository();
    const location = await locationRepo.findById(locationId);
    if (!location) {
      throw new Error('Território inválido');
    }

    const precision = this.determinePrecision(input, cepData);

    const address = await this.addressService.createAddress({
      location_id: locationId,
      postal_code: cepData.postalCode,
      street: normalizedStreet,
      number: input.number,
      complement: input.complement || null,
      address_type: 'exact',
      precision,
      owner_user_id: input.user_id,
      geocoding_source: 'viacep',
    });

    const residence = await residenceService.createResidence({
      user_id: input.user_id,
      address_id: address.id,
      location_id: locationId,
      country: 'Brasil',
      is_primary: true,
    });

    logger.info('Resident address registered', {
      userId: input.user_id,
      addressId: address.id,
      locationId,
      precision,
    });

    return {
      address,
      location_id: locationId,
      location_name: location.name,
      residence_id: residence.id,
      verification_status: 'pending',
    };
  }

  async updateResidentAddress(
    addressId: string,
    input: Partial<RegisterResidentAddressInput>,
  ): Promise<Address> {
    const updateData: Partial<RegisterResidentAddressInput> = {};

    if (input.postal_code) {
      const cepData = await locationGeocodingService.lookupPostalCode({
        postalCode: input.postal_code,
      });

      if (cepData) {
        updateData.postal_code = cepData.postalCode;
        if (!input.street && cepData.street) {
          updateData.street = cepData.street;
        }
      }
    }

    if (input.street) updateData.street = input.street;
    if (input.number) updateData.number = input.number;
    if (input.complement !== undefined) updateData.complement = input.complement || null;

    return this.addressService.updateAddress(addressId, updateData);
  }

  static toPublicDTO(address: Address): AddressPublicDTO {
    return {
      id: address.id,
      location_id: address.location_id,
      address_type: address.address_type,
      precision: address.precision || 'city',
      verification_status: address.verification_status || 'pending',
      latitude: address.is_verified ? address.latitude : null,
      longitude: address.is_verified ? address.longitude : null,
      is_verified: address.is_verified,
    };
  }

  async lookupCep(cep: string): Promise<LocationPostalCodeLookupResult | null> {
    logger.warn(
      '⚠️ ResidentAddressService.lookupCep() is deprecated. ' +
        'Use locationGeocodingService.lookupPostalCode() from @/core/location',
    );

    return locationGeocodingService.lookupPostalCode({
      postalCode: cep,
    });
  }

  private validateInput(input: RegisterResidentAddressInput): void {
    if (!input.user_id) {
      throw new Error('user_id é obrigatório');
    }

    if (!input.postal_code || !this.isValidPostalCode(input.postal_code)) {
      throw new Error('CEP inválido. Use o formato XXXXX-XXX.');
    }

    if (!input.number || input.number.trim() === '') {
      throw new Error('Número é obrigatório');
    }
  }

  private isValidPostalCode(postalCode: string): boolean {
    return /^\d{5}-?\d{3}$/.test(postalCode.trim());
  }

  private async resolveLocationFromCep(
    cepData: LocationPostalCodeLookupResult,
  ): Promise<string | null> {
    const locationId = cepData.locationData?.locationId ?? null;

    if (!locationId) {
      logger.warn('Location not reconciled for CEP', {
        postalCode: cepData.postalCode,
        providerCity: cepData.providerAddress.city,
        providerState: cepData.providerAddress.state,
      });
    }

    return locationId;
  }

  private determinePrecision(
    input: RegisterResidentAddressInput,
    cepData: LocationPostalCodeLookupResult,
  ): AddressPrecision {
    if (input.street && input.number && cepData.street) {
      return 'street';
    }

    if (cepData.street) {
      return 'street';
    }

    if (cepData.neighborhood) {
      return 'neighborhood';
    }

    return 'city';
  }
}

export const residentAddressService = new ResidentAddressService();
