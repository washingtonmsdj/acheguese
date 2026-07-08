/**
 * Profile Module - Public API
 *
 * Hooks genericos e servicos canonicos de perfil ficam em `core/profiles`.
 * Este barrel expoe somente a experiencia roteavel e componentes publicos do modulo.
 */

// Pages
export { ContaHubLayout } from "./pages/ContaHubLayout";
export type { ContaHubLayoutProps } from "./pages/ContaHubLayout";
export { default as ContaHubPage } from "./pages/ContaHubPage";
export { default as ContaEditarPage } from "./pages/ContaEditarPage";
export { default as ContaEditarPerfilPage } from "./pages/ContaEditarPerfilPage";
export { default as ContaEnderecosPage } from "./pages/ContaEnderecosPage";
export { default as ContaPreferenciasPage } from "./pages/ContaPreferenciasPage";
export { default as ContaSegurancaPage } from "./pages/ContaSegurancaPage";

// Module API
export * from "./hooks";
export * from "./sections";
export * from "./types";
