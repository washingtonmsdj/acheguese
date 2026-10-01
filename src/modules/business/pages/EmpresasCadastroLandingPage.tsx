import type { ReactNode } from "react";
import type { VerticalKey } from "@/core/verticals/config";
import CriarEmpresaPage from "./CriarEmpresaPage";

interface EmpresasCadastroLandingPageProps {
  header?: ReactNode;
  enabledVerticalKeys?: readonly VerticalKey[];
}

export default function EmpresasCadastroLandingPage({
  header,
  enabledVerticalKeys = [],
}: EmpresasCadastroLandingPageProps) {
  return (
    <>
      {header}
      <CriarEmpresaPage enabledVerticalKeys={enabledVerticalKeys} />
    </>
  );
}
