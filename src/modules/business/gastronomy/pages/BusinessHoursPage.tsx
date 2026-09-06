/**
 * BusinessHoursPage — Página de gestão de horários e operação
 *
 * Tabs:
 * - Horários da semana
 * - Exceções/feriados
 * - Configuração operacional
 *
 * SSOT: Usa componentes que consomem hooks
 */

import { useState } from 'react';
import { useBusinessDashboardContext } from '@/modules/business/dashboard/businessDashboardContext';
import { BusinessHoursForm } from '../components/hours/BusinessHoursForm';
import { ExceptionsManager } from '../components/hours/ExceptionsManager';
import { OperationConfigForm } from '../components/hours/OperationConfigForm';
import { BusinessStatusBadge } from '../components/hours/BusinessStatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Clock } from 'lucide-react';

export default function BusinessHoursPage() {
  const { businessDataId } = useBusinessDashboardContext();
  const [activeTab, setActiveTab] = useState('hours');

  if (!businessDataId) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-center text-destructive">ID do negócio não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8" />
            Horários e Operação
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure horários de funcionamento e modos de operação
          </p>
        </div>
        <BusinessStatusBadge businessId={businessDataId} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="exceptions">Exceções</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="mt-6">
          <BusinessHoursForm businessId={businessDataId} />
        </TabsContent>

        <TabsContent value="exceptions" className="mt-6">
          <ExceptionsManager businessId={businessDataId} />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <OperationConfigForm businessId={businessDataId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


