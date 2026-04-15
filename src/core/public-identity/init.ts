/**
 * Public Identity - Inicialização
 * Registra adapters no service
 * 
 * IMPORTANTE: Este arquivo deve ser importado no início da aplicação
 */

import { PublicIdentityService } from './services/PublicIdentityService';
import { BusinessIdentityAdapter } from './adapters/BusinessIdentityAdapter';
import { ProfileIdentityAdapter } from './adapters/ProfileIdentityAdapter';
import { ProfessionalIdentityAdapter } from './adapters/ProfessionalIdentityAdapter';

/**
 * Inicializa o módulo public-identity
 * Registra todos os adapters disponíveis
 */
export function initPublicIdentity(): void {
  PublicIdentityService.registerAdapter(new BusinessIdentityAdapter());
  PublicIdentityService.registerAdapter(new ProfileIdentityAdapter());
  PublicIdentityService.registerAdapter(new ProfessionalIdentityAdapter());
}

// Auto-inicialização (executado ao importar o módulo)
initPublicIdentity();

