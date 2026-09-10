/**
 * MULTI-PROFILE SERVICES - FASE 3
 * Export central para todos os services da arquitetura multi-perfil
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

export { MultiProfileService } from './profileService';
export { BusinessService } from './businessService';
export { ProfessionalService } from './professionalService';
export { DriverService } from './driverService';
export { ProfileMembersService } from './profileMembersService';
export { ProfileLinksService } from './profileLinksService';

export type {
  Profile,
  ProfileType,
  ProfileRole,
  LinkType,
  BusinessData,
  ProfessionalData,
  DriverData,
  ProfileMember,
  ProfileLink,
  ProfileWithExtension,
  CreateProfileInput,
  UpdateProfileInput,
  ProfileEditorExtensionForms,
  LoadProfileEditorInput,
  ProfileEditorSnapshot,
  SaveProfileEditorInput,
  ServiceResponse,
} from './types';
