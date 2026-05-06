import { DriverSettingsLayout } from "@/modules/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoboyConfiguracoesPage
 * 
 * Página de configurações de motoboy na Central (/central/motoboy/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motoboy".
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverSettingsLayout também é usado pela página legada
 * /perfil/mobilidade/motoboy/configuracoes para evitar duplicação de regra.
 */
export default function CentralMotoboyConfiguracoesPage() {
  return <DriverSettingsLayout service="motoboy" />;
}
