import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { BarChart3, Building2, Calendar, Tag, FileText } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface ContentCategory {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface ContentMetricsProps {
  title: string;
  description: string;
  icon: any;
  categories: ContentCategory[];
  total: number;
  loading?: boolean;
}

export function ContentMetrics({
  title,
  description,
  icon: Icon,
  categories,
  total,
  loading,
}: ContentMetricsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{category.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {category.percentage}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", category.color)}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold">{total.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Exemplos de uso
export function BusinessesByNichoMetrics({ data, loading }: { data?: any; loading?: boolean }) {
  // TODO: Implementar cálculo real
  const categories: ContentCategory[] = [
    { label: "Alimentação", count: 0, percentage: 0, color: "bg-orange-500" },
    { label: "Serviços", count: 0, percentage: 0, color: "bg-blue-500" },
    { label: "Comércio", count: 0, percentage: 0, color: "bg-green-500" },
    { label: "Saúde", count: 0, percentage: 0, color: "bg-red-500" },
    { label: "Outros", count: 0, percentage: 0, color: "bg-gray-500" },
  ];

  return (
    <ContentMetrics
      title="Empresas por Nicho"
      description="Distribuição de empresas por categoria"
      icon={Building2}
      categories={categories}
      total={0}
      loading={loading}
    />
  );
}

export function PostsByCategoryMetrics({ data, loading }: { data?: any; loading?: boolean }) {
  // TODO: Implementar cálculo real
  const categories: ContentCategory[] = [
    { label: "Discussão", count: 0, percentage: 0, color: "bg-blue-500" },
    { label: "Recomendação", count: 0, percentage: 0, color: "bg-green-500" },
    { label: "Enquete", count: 0, percentage: 0, color: "bg-purple-500" },
    { label: "Evento", count: 0, percentage: 0, color: "bg-orange-500" },
  ];

  return (
    <ContentMetrics
      title="Posts por Categoria"
      description="Distribuição de posts por tipo"
      icon={FileText}
      categories={categories}
      total={0}
      loading={loading}
    />
  );
}

export function EventsByMonthMetrics({ data, loading }: { data?: any; loading?: boolean }) {
  // TODO: Implementar cálculo real
  const categories: ContentCategory[] = [
    { label: "Janeiro", count: 0, percentage: 0, color: "bg-blue-500" },
    { label: "Fevereiro", count: 0, percentage: 0, color: "bg-green-500" },
    { label: "Março", count: 0, percentage: 0, color: "bg-purple-500" },
    { label: "Abril", count: 0, percentage: 0, color: "bg-orange-500" },
  ];

  return (
    <ContentMetrics
      title="Eventos por Mês"
      description="Distribuição de eventos ao longo do ano"
      icon={Calendar}
      categories={categories}
      total={0}
      loading={loading}
    />
  );
}
