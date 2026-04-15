/**
 * Profile module public API.
 *
 * Identidade, sessao e operacoes canonicas de perfil pertencem a `core/profiles`.
 * Este modulo expoe apenas paginas e hooks especificos da experiencia de perfil.
 */

export { default as ConfiguracoesPage } from './pages/ConfiguracoesPage';
export { default as FamiliaPage } from './pages/FamiliaPage';
export { default as PerfilContaPage } from './pages/PerfilContaPage';
export { default as PerfilEditarPage } from './pages/PerfilEditarPage';
export { default as PerfilHubPage } from './pages/PerfilHubPage';
export { default as PerfilIdentidadesPage } from './pages/PerfilIdentidadesPage';
export { ProfilePublicPage } from './pages/ProfilePublicPage';

export { useActivityStats } from './hooks/useActivityStats';
export { useEcosystemSummary } from './hooks/useEcosystemSummary';
export { usePerfilPageV3 } from './hooks/usePerfilPageV3';
export { useProfileCompleteness } from './hooks/useProfileCompleteness';
export { useSavedPosts } from './hooks/useSavedPosts';
export { useUserActivity } from './hooks/useUserActivity';
export { useUserMentions } from './hooks/useUserMentions';
export { useUserPosts } from './hooks/useUserPosts';

export type { Business, Profile, ProfileStats } from './types';
