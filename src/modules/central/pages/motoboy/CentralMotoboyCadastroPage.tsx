import { DriverProfileLayout } from "@/core/mobility/components/driver/DriverProfileLayout";

/**
 * CentralMotoboyCadastroPage
 *
 * Pagina de cadastro de motoboy na Central (/central/motoboy/cadastro).
 * Renderiza o componente compartilhado DriverProfileLayout com service="motoboy".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoboyCadastroPage() {
  return <DriverProfileLayout service="motoboy" />;
}
