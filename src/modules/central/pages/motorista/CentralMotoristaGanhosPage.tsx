import { DriverEarningsLayout } from "@/core/mobility/components/driver";

/**
 * CentralMotoristaGanhosPage
 *
 * Pagina de ganhos de motorista na Central (/central/motorista/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motorista".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoristaGanhosPage() {
  return <DriverEarningsLayout service="motorista" />;
}
