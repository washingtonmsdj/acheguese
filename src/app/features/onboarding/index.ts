/**
 * modules/onboarding — API pública
 *
 * Fluxo de cadastro e confirmação de novos usuários.
 * Tipo: TRANSVERSAL (entry-point de auth/onboarding)
 *
 * @sealed Não importar de outros módulos verticais.
 */

export { default as CadastroPage } from "./pages/CadastroPage";
export { default as CadastroConfirmacaoPage } from "./pages/CadastroConfirmacaoPage";
export { useCadastro } from "./hooks/useCadastro";
export { useOnboarding } from "./hooks/useOnboarding";
