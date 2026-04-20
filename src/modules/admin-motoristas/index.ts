/**
 * modules/admin-motoristas — API pública
 *
 * Sub-shell administrativo de Motoristas.
 * Tipo: TRANSVERSAL (UI-only, depende de modules/admin para shell)
 *
 * @sealed Não importar de outros módulos verticais.
 */

export { default as AdminMotoristasPage } from "./pages/AdminMotoristasPage";
export { default as AdminMotoristasLayout } from "./pages/AdminMotoristasLayout";
export { useDriverManagement } from "./hooks/useDriverManagement";
