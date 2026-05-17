import { DriverEarningsLayout } from "@/core/mobility/components/driver/DriverEarningsLayout";

/**
 * CentralMotoboyGanhosPage
 * 
 * PÃ¡gina de ganhos de motoboy na Central (/central/motoboy/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motoboy".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoboyGanhosPage() {
  return <DriverEarningsLayout service="motoboy" />;
}
