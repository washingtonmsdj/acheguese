import { DriverSettingsLayout } from "@/core/mobility/components/driver";

/**
 * CentralMotoristaConfiguracoesPage
 *
 * Pagina de configuracoes de motorista na Central (/central/motorista/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motorista".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoristaConfiguracoesPage() {
  return <DriverSettingsLayout service="motorista" />;
}
