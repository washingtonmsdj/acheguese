/**
 * AdminDashboardPage — Dashboard administrativo
 *
 * Visão geral da plataforma.
 * Consome hooks (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { usePlatformStats } from '@/modules/admin/hooks/useAdmin';
import { Building2, Users, ShoppingCart, DollarSign, Bike, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function AdminDashboardPage() {
  const { data: stats, isLoading } = usePlatformStats();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const mainStats = [
    {
      icon: Building2,
      label: 'Total de Empresas',
      value: stats.total_businesses,
      subValue: `${stats.active_businesses} ativas`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Users,
      label: 'Total de Usuários',
      value: stats.total_users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: ShoppingCart,
      label: 'Pedidos Concluídos',
      value: stats.total_orders,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: DollarSign,
      label: 'Receita Total',
      value: `R$ ${stats.total_revenue.toFixed(2)}`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      icon: Bike,
      label: 'Entregas Concluídas',
      value: stats.total_deliveries,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      icon: TrendingUp,
      label: 'Taxa de Ativação',
      value: `${((stats.active_businesses / stats.total_businesses) * 100).toFixed(1)}%`,
      subValue: 'empresas ativas',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma
        </p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.subValue && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.subValue}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribuição de Planos */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Planos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.plan_distribution).map(([plan, count]) => {
              const percentage = (count / stats.total_businesses) * 100;
              const planLabels: Record<string, string> = {
                free: 'Free',
                pro: 'Pro',
                delivery: 'Delivery',
              };

              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {Object.entries(planLabels).find(([key]) => key === plan)?.[1] ?? plan}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {count} empresas ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Ticket médio: R${' '}
            {stats.total_orders > 0
              ? (stats.total_revenue / stats.total_orders).toFixed(2)
              : '0.00'}
          </p>
          <p>
            • Pedidos por empresa ativa:{' '}
            {stats.active_businesses > 0
              ? (stats.total_orders / stats.active_businesses).toFixed(1)
              : '0'}
          </p>
          <p>
            • Taxa de entrega:{' '}
            {stats.total_orders > 0
              ? ((stats.total_deliveries / stats.total_orders) * 100).toFixed(1)
              : '0'}
            % dos pedidos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
