import { DriverEarningsLayout } from "@/modules/mobility/components/driver/DriverEarningsLayout";

/**
 * CentralMotoboyGanhosPage
 * 
 * Página de ganhos de motoboy na Central (/central/motoboy/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motoboy".
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverEarningsLayout também é usado pela página legada
 * /perfil/mobilidade/motoboy/ganhos para evitar duplicação de regra.
 */
export default function CentralMotoboyGanhosPage() {
  return <DriverEarningsLayout service="motoboy" />;
}
