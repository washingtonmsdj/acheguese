import { DriverEarningsLayout } from "@/modules/mobility/components/driver/DriverEarningsLayout";

/**
 * CentralMotoristaGanhosPage
 * 
 * PÃ¡gina de ganhos de motorista na Central (/central/motorista/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motorista".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoristaGanhosPage() {
  return <DriverEarningsLayout service="motorista" />;
}
