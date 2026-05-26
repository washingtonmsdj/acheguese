import { DriverEarningsLayout } from "@/core/mobility/components/driver";

/**
 * CentralMotoboyGanhosPage
 *
 * Pagina de ganhos de motoboy na Central (/central/motoboy/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motoboy".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoboyGanhosPage() {
  return <DriverEarningsLayout service="motoboy" />;
}
