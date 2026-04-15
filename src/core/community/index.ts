/**
 * Core Community Barrel Export
 * 
 * Re-exporta funcionalidades do módulo community que são usadas por outras camadas core.
 * Isso mantém o isolamento de módulos enquanto permite que core acesse funcionalidades compartilhadas.
 */

// Services
export { CommunityService } from './services/CommunityService';

// Re-export do módulo community
export * from '@/modules/community';
