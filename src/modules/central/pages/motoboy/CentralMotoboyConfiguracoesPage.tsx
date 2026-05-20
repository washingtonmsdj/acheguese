import { DriverSettingsLayout } from "@/core/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoboyConfiguracoesPage
 *
 * Pagina de configuracoes de motoboy na Central (/central/motoboy/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motoboy".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoboyConfiguracoesPage() {
  return <DriverSettingsLayout service="motoboy" />;
}
