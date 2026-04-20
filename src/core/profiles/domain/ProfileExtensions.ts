/**
 * ProfileExtensions — Extensões por Tipo de Perfil
 * 
 * Cada tipo de perfil (business, professional, driver) tem dados específicos
 * armazenados em tabelas separadas.
 * 
 * @version 2.0.0
 */

// ══════════════════════════════════════════════════════════════════════════
// BUSINESS DATA
// ══════════════════════════════════════════════════════════════════════════

export interface BusinessData {
  profileId: string;
  legalName: string;
  cnpj: string | null;
  taxId: string | null;
  companyType: 'mei' | 'ltda' | 'sa' | 'eireli' | 'other' | null;
  industry: string | null;
  employeeCount: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null;
  foundedYear: number | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessZip: string | null;
  businessHours: unknown;
  createdAt: string;
  updatedAt: string;
}

// ══════════════════════════════════════════════════════════════════════════
// PROFESSIONAL DATA
// ══════════════════════════════════════════════════════════════════════════

export interface ProfessionalData {
  profileId: string;
  profession: string;
  specialties: string[] | null;
  licenseNumber: string | null;
  licenseState: string | null;
  yearsExperience: number | null;
  education: string | null;
  certifications: string[] | null;
  servicesOffered: string[] | null;
  serviceArea: string[] | null;
  hourlyRate: number | null;
  acceptsRemote: boolean;
  createdAt: string;
  updatedAt: string;
}

// ══════════════════════════════════════════════════════════════════════════
// DRIVER DATA
// ══════════════════════════════════════════════════════════════════════════

export interface DriverData {
  profileId: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  licenseState: string;
  vehicleType: 'car' | 'motorcycle' | 'van' | 'truck' | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleColor: string | null;
  documentsVerified: boolean;
  documentsVerifiedAt: string | null;
  backgroundCheckStatus: 'pending' | 'approved' | 'rejected' | null;
  backgroundCheckDate: string | null;
  isAvailable: boolean;
  currentLocation: unknown;
  lastLocationUpdate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ══════════════════════════════════════════════════════════════════════════
// PROFILE WITH EXTENSION (UNION TYPE)
// ══════════════════════════════════════════════════════════════════════════

import type { Profile } from './Profile';

/**
 * ProfileWithExtension — Profile + Extensão Tipada
 * 
 * Union type que garante type safety ao acessar extensões.
 */
export type ProfileWithExtension =
  | { profile: Profile; extension: null; type: 'personal' }
  | { profile: Profile; extension: BusinessData; type: 'business' }
  | { profile: Profile; extension: ProfessionalData; type: 'professional' }
  | { profile: Profile; extension: DriverData; type: 'driver' };

/**
 * Type guard para ProfileWithExtension
 */
export function isBusinessProfile(
  profileWithExt: ProfileWithExtension
): profileWithExt is { profile: Profile; extension: BusinessData; type: 'business' } {
  return profileWithExt.type === 'business';
}

export function isProfessionalProfile(
  profileWithExt: ProfileWithExtension
): profileWithExt is { profile: Profile; extension: ProfessionalData; type: 'professional' } {
  return profileWithExt.type === 'professional';
}

export function isDriverProfile(
  profileWithExt: ProfileWithExtension
): profileWithExt is { profile: Profile; extension: DriverData; type: 'driver' } {
  return profileWithExt.type === 'driver';
}
