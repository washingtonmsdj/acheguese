import { DriverSettingsLayout } from "@/modules/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoristaConfiguracoesPage
 * 
 * Página de configurações de motorista na Central (/central/motorista/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motorista".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoristaConfiguracoesPage() {
  return <DriverSettingsLayout service="motorista" />;
}
