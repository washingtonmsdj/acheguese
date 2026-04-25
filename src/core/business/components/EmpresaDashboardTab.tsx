import { BarChart3, Bike, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { RequestMotoboyButton } from "@/core/mobility/components/RequestMotoboyButton";

interface Props {
  businessId: string;
}

export default function EmpresaDashboardTab({ businessId }: Props) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Gerencie entregas e operações da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RequestMotoboyButton
            sourceType="business"
            sourceId={businessId}
            variant="default"
            size="lg"
            className="w-full sm:w-auto"
          />
        </CardContent>
      </Card>

      {/* Placeholder para métricas futuras */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Ativas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


