import { DriverEarningsLayout } from "@/modules/mobility/components/driver/DriverEarningsLayout";

/**
 * CentralMotoboyGanhosPage
 * 
 * Página de ganhos de motoboy na Central (/central/motoboy/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motoboy".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoboyGanhosPage() {
  return <DriverEarningsLayout service="motoboy" />;
}
