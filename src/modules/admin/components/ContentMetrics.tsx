import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Building2, Calendar, FileText } from "lucide-react";
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

function toCategoriesFromCountMap(
  input: Record<string, number> | undefined,
  palette: string[],
): ContentCategory[] {
  if (!input || Object.keys(input).length === 0) return [];

  const total = Object.values(input).reduce((sum, count) => sum + (count || 0), 0);
  if (total === 0) return [];

  return Object.entries(input).map(([label, count], index) => ({
    label,
    count,
    percentage: Math.round((count / total) * 100),
    color: palette[index % palette.length],
  }));
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
                <span className="text-sm text-muted-foreground">{category.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", category.color)} style={{ width: `${category.percentage}%` }} />
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

export function BusinessesByNichoMetrics({ data, loading }: { data?: any; loading?: boolean }) {
  const fallback = {
    Alimentacao: 0,
    Servicos: 0,
    Comercio: 0,
    Saude: 0,
    Outros: 0,
  };
  const byCategory = (data?.byCategory as Record<string, number> | undefined) ?? fallback;
  const categories = toCategoriesFromCountMap(byCategory, [
    "bg-orange-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-red-500",
    "bg-gray-500",
  ]);
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <ContentMetrics
      title="Empresas por Nicho"
      description="Distribuicao de empresas por categoria"
      icon={Building2}
      categories={categories}
      total={total}
      loading={loading}
    />
  );
}

export function PostsByCategoryMetrics({ data, loading }: { data?: any; loading?: boolean }) {
  const fallback = {
    Discussao: 0,
    Recomendacao: 0,
    Enquete: 0,
    Evento: 0,
  };
  const byCategory = (data?.byType as Record<string, number> | undefined) ?? fallback;
  const categories = toCategoriesFromCountMap(byCategory, [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
  ]);
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <ContentMetrics
      title="Posts por Categoria"
      description="Distribuicao de posts por tipo"
      icon={FileText}
      categories={categories}
      total={total}
      loading={loading}
    />
  );
}

export function EventsByMonthMetrics({ data, loading }: { data?: any; loading?: boolean }) {
  const fallback = {
    Janeiro: 0,
    Fevereiro: 0,
    Marco: 0,
    Abril: 0,
  };
  const byMonth = (data?.byMonth as Record<string, number> | undefined) ?? fallback;
  const categories = toCategoriesFromCountMap(byMonth, [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
  ]);
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <ContentMetrics
      title="Eventos por Mes"
      description="Distribuicao de eventos ao longo do ano"
      icon={Calendar}
      categories={categories}
      total={total}
      loading={loading}
    />
  );
}
