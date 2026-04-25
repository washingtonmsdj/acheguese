/**
 * QuickActionsCard — Card de ações rápidas
 *
 * Atalhos para funcionalidades principais.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Link } from 'react-router-dom';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import {
  UtensilsCrossed,
  Clock,
  MapPin,
  Package,
  Settings,
  Zap,
  Bike,
  BarChart3,
} from 'lucide-react';

interface QuickActionsCardProps {
  businessId: string;
}

export function QuickActionsCard({ businessId }: QuickActionsCardProps) {
  const actions = [
    {
      icon: UtensilsCrossed,
      label: 'Cardápio',
      href: businessManagementRoutes.gastronomyCardapio(businessId),
      color: 'text-orange-600',
    },
    {
      icon: Package,
      label: 'Pedidos',
      href: businessManagementRoutes.gastronomyPedidos(businessId),
      color: 'text-blue-600',
    },
    {
      icon: Bike,
      label: 'Entregas',
      href: businessManagementRoutes.gastronomyEntregas(businessId),
      color: 'text-indigo-600',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      href: businessManagementRoutes.gastronomyAnalytics(businessId),
      color: 'text-cyan-600',
    },
    {
      icon: Clock,
      label: 'Horários',
      href: businessManagementRoutes.gastronomyHorarios(businessId),
      color: 'text-purple-600',
    },
    {
      icon: MapPin,
      label: 'Áreas de Entrega',
      href: businessManagementRoutes.gastronomyAreaEntrega(businessId),
      color: 'text-green-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} to={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col gap-2 py-4"
                >
                  <Icon className={`w-6 h-6 ${action.color}`} />
                  <span className="text-sm">{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
