import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

export default function BusinessAnalyticsPage() {
  const { businessId, isGastronomyActive, entitlements } = useBusinessDashboardContext();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics da empresa
          </CardTitle>
          <CardDescription>
            Indicadores consolidados por empresa e por vertical.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Analytics basico:{" "}
            <span className="font-medium">
              {entitlements.canUseBasicAnalytics ? "liberado" : "bloqueado"}
            </span>
          </p>
          <p className="text-sm">
            Analytics avancado:{" "}
            <span className="font-medium">
              {entitlements.canUseAdvancedAnalytics ? "liberado" : "bloqueado"}
            </span>
          </p>
          {isGastronomyActive && (
            <Link to={businessManagementRoutes.gastronomyAnalytics(businessId)}>
              <Button variant="outline" size="sm">
                Abrir analytics de gastronomia
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
