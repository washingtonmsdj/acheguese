import { Link } from "react-router-dom";
import { BarChart3, CreditCard, Link as LinkIcon, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

export default function BusinessOverviewPage() {
  const {
    businessId,
    business,
    planTier,
    isGastronomyActive,
    isGastronomyEligible,
    publicUrl,
    premiumUrl,
  } = useBusinessDashboardContext();
  const showAnalytics = isLaunchSurfaceEnabled("publicAnalytics");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status da empresa</CardDescription>
            <CardTitle>{business.status}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plano atual</CardDescription>
            <CardTitle className="uppercase">{planTier}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vertical gastronomia</CardDescription>
            <CardTitle>{isGastronomyActive ? "Ativa" : isGastronomyEligible ? "Disponivel" : "Nao elegivel"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Slug publico</CardDescription>
            <CardTitle>{business.slug || "Nao configurado"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atalhos da empresa</CardTitle>
          <CardDescription>Fluxo principal para gestao da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to={businessManagementRoutes.dados(businessId)}>
            <Button variant="outline">Dados da empresa</Button>
          </Link>
          {isGastronomyEligible && (
            <Link to={businessManagementRoutes.gastronomia(businessId)}>
              <Button variant="outline" className="gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Gastronomia
              </Button>
            </Link>
          )}
          <Link to={businessManagementRoutes.planos(businessId)}>
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Planos
            </Button>
          </Link>
          <Link to={businessManagementRoutes.linkPremium(businessId)}>
            <Button variant="outline" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Link premium
            </Button>
          </Link>
          {showAnalytics && (
            <Link to={businessManagementRoutes.analytics(businessId)}>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links ativos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Publico</Badge>
            <span className="text-muted-foreground">{publicUrl || "Nao disponivel"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Premium</Badge>
            <span className="text-muted-foreground">{premiumUrl || "Nao disponivel"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
