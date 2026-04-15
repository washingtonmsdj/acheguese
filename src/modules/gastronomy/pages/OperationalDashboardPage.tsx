/**
 * OperationalDashboardPage — Dashboard operacional consolidado
 *
 * Integra todas as funcionalidades em uma visão única.
 * SSOT: Usa componentes que consomem hooks
 */

import { useParams } from 'react-router-dom';
import { OperationalStatusCard } from '../components/dashboard/OperationalStatusCard';
import { TodayOrdersCard } from '../components/dashboard/TodayOrdersCard';
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard';
import { MenuSummaryCard } from '../components/dashboard/MenuSummaryCard';
import { DeliverySummaryCard } from '../components/dashboard/DeliverySummaryCard';
import { PlanStatusWidget } from '../components/PlanStatusWidget';
import { LayoutDashboard } from 'lucide-react';

export default function OperationalDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();

  if (!businessId) {
    return (
      <div className="container max-w-7xl py-8">
        <p className="text-center text-destructive">ID do negócio não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8" />
          Dashboard Operacional
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do seu negócio gastronômico
        </p>
      </div>

      {/* Status do Plano */}
      <PlanStatusWidget
        businessId={businessId}
        currentMenuItems={0}
        currentImages={0}
        currentPromotions={0}
      />

      {/* Grid Principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Status e Pedidos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Operacional */}
          <OperationalStatusCard businessId={businessId} />

          {/* Pedidos de Hoje */}
          <TodayOrdersCard businessId={businessId} />

          {/* Ações Rápidas */}
          <QuickActionsCard businessId={businessId} />
        </div>

        {/* Coluna Direita - Resumos */}
        <div className="space-y-6">
          {/* Cardápio */}
          <MenuSummaryCard businessId={businessId} />

          {/* Áreas de Entrega */}
          <DeliverySummaryCard businessId={businessId} />
        </div>
      </div>
    </div>
  );
}


