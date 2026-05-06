import { DriverSettingsLayout } from "@/modules/mobility/components/driver/DriverSettingsLayout";

/**
 * PerfilMobilidadeMotoboyConfiguracoesPage
 * 
 * Página legada de configurações de motoboy (/perfil/mobilidade/motoboy/configuracoes).
 * Reutiliza o componente compartilhado DriverSettingsLayout com service="motoboy".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoboyConfiguracoesPage() {
  return <DriverSettingsLayout service="motoboy" />;
}
