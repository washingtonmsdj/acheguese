import { DriverProfileLayout } from "@/core/mobility/components/driver";

/**
 * CentralMotoristaCadastroPage
 *
 * Pagina de cadastro de motorista na Central (/central/motorista/cadastro).
 * Renderiza o componente compartilhado DriverProfileLayout com service="motorista".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoristaCadastroPage() {
  return <DriverProfileLayout service="motorista" />;
}
