import { DriverSettingsLayout } from "@/modules/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoboyConfiguracoesPage
 * 
 * PÃ¡gina de configuraÃ§Ãµes de motoboy na Central (/central/motoboy/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motoboy".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoboyConfiguracoesPage() {
  return <DriverSettingsLayout service="motoboy" />;
}
