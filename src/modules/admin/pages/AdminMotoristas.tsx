/**
 * AdminMotoristas - REFATORADO
 * 
 * Página de Gestão de Motoristas
 * 
 * REFATORAÇÃO: 1.131 linhas → ~250 linhas (orquestração limpa)
 * SSOT: Todas as sections e componentes tipados
 * Sem gambiarras: Código profissional e modular
 * 
 * PROFILE.1.3b - BURN-DOWN AGRESSIVO
 * AdminMotoristas migrado para usar ProfileService como fonte única de verdade
 * Elimina regras manuais: is_verified, is_suspended, is_online
 * Score original: 237 (19 regras manuais + 1 wrapper antigo)
 */

import AdminMotoristasPage from "@/modules/admin-motoristas/pages/AdminMotoristasPage";

export default function AdminMotoristas() {
  return <AdminMotoristasPage />;
}
