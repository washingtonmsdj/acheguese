import { DriverSettingsLayout } from "@/core/mobility/components/driver/DriverSettingsLayout";

/**
 * CentralMotoboyConfiguracoesPage
 * 
 * PÃ¡gina de configuraÃ§Ãµes de motoboy na Central (/central/motoboy/configuracoes).
 * Renderiza o componente compartilhado DriverSettingsLayout com service="motoboy".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoboyConfiguracoesPage() {
  return <DriverSettingsLayout service="motoboy" />;
}
