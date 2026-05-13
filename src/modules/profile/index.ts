/**
 * Profile module public API.
 *
 * Identidade, sessao e operacoes canonicas de perfil pertencem a `core/profiles`.
 * Este modulo expoe apenas paginas e hooks especificos da experiencia de perfil.
 */

export { default as ContaSegurancaPage } from './pages/ContaSegurancaPage';
export { default as ContaEditarPerfilPage } from './pages/ContaEditarPerfilPage';
export { default as ContaHubPage } from './pages/ContaHubPage';
export { ProfilePublicPage } from './pages/ProfilePublicPage';

export { useActivityStats } from './hooks/useActivityStats';
export { useEcosystemSummary } from './hooks/useEcosystemSummary';
export { useContaWorkspace } from './hooks/usePerfilPageV3';
export { useProfileCompleteness } from './hooks/useProfileCompleteness';
export { useSavedPosts } from './hooks/useSavedPosts';
export { useUserActivity } from './hooks/useUserActivity';
export { useUserMentions } from './hooks/useUserMentions';
export { useUserPosts } from './hooks/useUserPosts';

export type { Business, Profile, ProfileStats } from './types';
