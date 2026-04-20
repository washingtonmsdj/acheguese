/**
 * modules/professionals — API pública
 *
 * Páginas públicas de profissionais (perfil por slug).
 * Tipo: VERTICAL (delega lógica para core/professional)
 *
 * @sealed Não importar de outros módulos verticais.
 */

export { default as ProfissionalPublicPage } from "./pages/ProfissionalPublicPage";
export { useProfessionalBySlug } from "./hooks/useProfessionalBySlug";
