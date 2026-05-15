/**
 * modules/admin-identidade — API pública
 *
 * Sub-shell administrativo de Identidade.
 * Tipo: TRANSVERSAL (UI-only, depende de modules/admin para shell)
 *
 * @sealed Não importar de outros módulos verticais.
 */

export { default as AdminIdentidadePage } from "./pages/AdminIdentidadePage";
export { AdminIdentidadeLayout } from "./pages/AdminIdentidadeLayout";
