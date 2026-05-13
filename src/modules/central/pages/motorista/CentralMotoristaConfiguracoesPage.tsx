import { DriverSettingsLayout } from "@/modules/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoristaConfiguracoesPage
 * 
 * PÃ¡gina de configuraÃ§Ãµes de motorista na Central (/central/motorista/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motorista".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoristaConfiguracoesPage() {
  return <DriverSettingsLayout service="motorista" />;
}
