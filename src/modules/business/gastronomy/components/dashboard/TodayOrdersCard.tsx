/**
 * TodayOrdersCard - Card de pedidos do dia
 *
 * Mostra resumo dos pedidos de hoje.
 * SSOT: Usa useOrders
 */

import { useOrders } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { startOfDay, endOfDay } from 'date-fns';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

interface TodayOrdersCardProps {
  businessId: string;
}

export function TodayOrdersCard({ businessId }: TodayOrdersCardProps) {
  const today = new Date();
  const { orders, isLoading, isRealtimeConnected } = useOrders(businessId, {
    date_from: startOfDay(today).toISOString(),
    date_to: endOfDay(today).toISOString(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const totalOrders = orders?.length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === 'pending').length ?? 0;
  const preparingOrders = orders?.filter((o) => o.status === 'preparing').length ?? 0;
  const completedOrders = orders?.filter((o) => o.status === 'completed').length ?? 0;

  const totalRevenue =
    orders?.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.total, 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Pedidos de Hoje
        </CardTitle>
        <p className={`text-xs ${isRealtimeConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
          {isRealtimeConnected ? 'Atualizacao automatica ativa' : 'Reconectando atualizacao automatica'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-4xl font-bold">{totalOrders}</p>
          <p className="text-sm text-muted-foreground">pedidos recebidos</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{preparingOrders}</p>
            <p className="text-xs text-muted-foreground">Preparando</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
            <p className="text-xs text-muted-foreground">Concluidos</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Receita do dia:</span>
            <span className="text-lg font-bold">R$ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        <Link to={businessManagementRoutes.gastronomyPedidos(businessId)}>
          <Button variant="outline" className="w-full">
            Ver Todos os Pedidos
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
