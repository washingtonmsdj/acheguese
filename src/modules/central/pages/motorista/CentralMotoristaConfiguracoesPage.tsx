import { DriverSettingsLayout } from "@/modules/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoristaConfiguracoesPage
 * 
 * Página de configurações de motorista na Central (/central/motorista/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motorista".
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverSettingsLayout também é usado pela página legada
 * /perfil/mobilidade/motorista/configuracoes para evitar duplicação de regra.
 */
export default function CentralMotoristaConfiguracoesPage() {
  return <DriverSettingsLayout service="motorista" />;
}
