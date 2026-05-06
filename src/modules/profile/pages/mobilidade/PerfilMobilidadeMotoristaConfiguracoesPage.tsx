import { DriverSettingsLayout } from "@/modules/mobility/components/driver/DriverSettingsLayout";

/**
 * PerfilMobilidadeMotoristaConfiguracoesPage
 * 
 * Página legada de configurações de motorista (/perfil/mobilidade/motorista/configuracoes).
 * Reutiliza o componente compartilhado DriverSettingsLayout com service="motorista".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoristaConfiguracoesPage() {
  return <DriverSettingsLayout service="motorista" />;
}
