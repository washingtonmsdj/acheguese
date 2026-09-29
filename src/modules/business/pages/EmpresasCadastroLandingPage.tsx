import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { getActiveBusinessVerticalKeys } from "@/app/config/businessVerticalScope";
import CriarEmpresaPage from "./CriarEmpresaPage";

export default function EmpresasCadastroLandingPage() {
  return (
    <>
      <AuthBrandHeader showBack={false} />
      <CriarEmpresaPage enabledVerticalKeys={getActiveBusinessVerticalKeys()} />
    </>
  );
}
