/**
 * AnalyticsPage — Página de analytics e métricas
 *
 * Dashboard completo de analytics.
 * Consome hooks (SSOT).
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { AnalyticsOverviewCard } from '@/modules/business/gastronomy/components/analytics/AnalyticsOverviewCard';
import { AnalyticsChartCard } from '@/modules/business/gastronomy/components/analytics/AnalyticsChartCard';
import { AnalyticsEngagementCard } from '@/modules/business/gastronomy/components/analytics/AnalyticsEngagementCard';
import { CalendarIcon, Download, Lightbulb } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from '@/shared/utils/dateLocale';
import { cn } from '@/shared/utils/cn';

export default function AnalyticsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handlePresetRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  if (!businessId) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">ID da empresa não encontrado</p>
      </div>
    );
  }

  const dateFrom = format(dateRange.from, 'yyyy-MM-dd');
  const dateTo = format(dateRange.to, 'yyyy-MM-dd');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho do seu negócio
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Presets de período */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetRange(7)}
            >
              7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetRange(30)}
            >
              30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetRange(90)}
            >
              90 dias
            </Button>
          </div>

          {/* Seletor de data */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                      {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {/* Exportar */}
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Período selecionado */}
      <div className="text-sm text-muted-foreground">
        Exibindo dados de{' '}
        <span className="font-medium">
          {format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })}
        </span>{' '}
        até{' '}
        <span className="font-medium">
          {format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>

      {/* Visão Geral */}
      <AnalyticsOverviewCard
        businessId={businessId}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {/* Layout de 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico (2 colunas) */}
        <div className="lg:col-span-2">
          <AnalyticsChartCard
            businessId={businessId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </div>

        {/* Engajamento (1 coluna) */}
        <div className="lg:col-span-1">
          <AnalyticsEngagementCard
            businessId={businessId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
          Insights
        </h3>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            • Seus pedidos aumentaram 15% em relação ao período anterior
          </p>
          <p className="text-muted-foreground">
            • O horário de pico é entre 19h e 21h
          </p>
          <p className="text-muted-foreground">
            • Taxa de conversão está acima da média do setor (2.5%)
          </p>
        </div>
      </div>
    </div>
  );
}


