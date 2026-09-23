import { Link } from "react-router-dom";
import { Building2, Settings } from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function BusinessOverviewPage() {
  const { businessId, business, publicUrl } =
    useActiveBusinessDashboardContext();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status da empresa</CardDescription>
            <CardTitle>{business.status}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categoria</CardDescription>
            <CardTitle className="capitalize">{business.category}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Slug público</CardDescription>
            <CardTitle>{business.slug || "Não configurado"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atalhos da empresa</CardTitle>
          <CardDescription>
            Fluxos ativos de gestão no MVP.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to={businessManagementRoutes.dados(businessId)}>
            <Button variant="outline" className="gap-2">
              <Building2 className="h-4 w-4" />
              Dados da empresa
            </Button>
          </Link>
          <Link to={businessManagementRoutes.configuracoes(businessId)}>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
          </Link>
          {publicUrl ? (
            <Link to={publicUrl}>
              <Button variant="outline">Página pública</Button>
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
