/**
 * AdminPlansPage — Gestão de planos e uso
 *
 * Visualiza uso de planos por empresa.
 * Consome hooks (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { usePlanUsage } from '@/modules/admin/hooks/useAdmin';
import { Building2, ShoppingCart, DollarSign, Eye, QrCode } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function AdminPlansPage() {
  const { data: planUsage, isLoading } = usePlanUsage();

  const planColors: Record<string, string> = {
    free: 'secondary',
    pro: 'default',
    delivery: 'destructive',
  };

  const planLabels: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    delivery: 'Delivery',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestão de Planos</h1>
        <p className="text-muted-foreground">
          Visualize o uso de recursos por plano
        </p>
      </div>

      {/* Resumo por Plano */}
      {!isLoading && planUsage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['free', 'pro', 'delivery'].map((plan) => {
            const businesses = planUsage.filter((u) => u.plan_tier === plan);
            const totalOrders = businesses.reduce((sum, b) => sum + b.total_orders, 0);
            const totalRevenue = businesses.reduce((sum, b) => sum + b.total_revenue, 0);

            return (
              <Card key={plan}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Plano {planLabels[plan]}</span>
                    <Badge variant={planColors[plan] as any}>
                      {businesses.length} empresas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pedidos</span>
                    <span className="font-medium">{totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Receita</span>
                    <span className="font-medium">R$ {totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ticket Médio</span>
                    <span className="font-medium">
                      R${' '}
                      {totalOrders > 0
                        ? (totalRevenue / totalOrders).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Uso Detalhado por Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : planUsage && planUsage.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Scans QR</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planUsage.map((usage) => {
                  const conversionRate =
                    usage.total_views > 0
                      ? ((usage.total_orders / usage.total_views) * 100).toFixed(2)
                      : '0.00';

                  return (
                    <TableRow key={usage.business_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{usage.business_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={planColors[usage.plan_tier] as any}>
                          {planLabels[usage.plan_tier]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                          {usage.total_orders}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {usage.total_revenue.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <QrCode className="h-3 w-3 text-muted-foreground" />
                          {usage.total_qr_scans}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {usage.total_views}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{conversionRate}%</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado disponível
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPlansPage;
