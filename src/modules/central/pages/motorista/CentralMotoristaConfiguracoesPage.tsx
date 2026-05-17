import { DriverSettingsLayout } from "@/core/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoristaConfiguracoesPage
 * 
 * PÃ¡gina de configuraÃ§Ãµes de motorista na Central (/central/motorista/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motorista".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoristaConfiguracoesPage() {
  return <DriverSettingsLayout service="motorista" />;
}
