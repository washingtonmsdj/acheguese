import { DriverEarningsLayout } from "@/core/mobility/components/driver/DriverEarningsLayout";

/**
 * CentralMotoristaGanhosPage
 * 
 * PÃ¡gina de ganhos de motorista na Central (/central/motorista/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motorista".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoristaGanhosPage() {
  return <DriverEarningsLayout service="motorista" />;
}
