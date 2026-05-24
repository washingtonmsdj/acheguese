import React from "react";
import { Star, CheckCircle2, Clock, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Progress } from "@/shared/components/ui/progress";

interface DriverPublicReputationProps {
  driver: {
    id: string;
    name: string;
    avatar_url?: string;
    rating: number;
    total_ratings: number;
    total_rides: number;
    completion_rate: number;
    punctuality_rate: number;
    cancellation_rate: number;
    priority_score: number;
    on_time_completions?: number;
    delayed_completions?: number;
    avg_delay_minutes?: number;
  };
  compact?: boolean;
}

export function DriverPublicReputation({
  driver,
  compact = false,
}: DriverPublicReputationProps) {
  // Determinar badge de pontualidade
  const getPunctualityBadge = (rate: number) => {
    if (rate >= 95) return { label: "Super pontual", color: "bg-green-500" };
    if (rate >= 85) return { label: "Pontual", color: "bg-blue-500" };
    if (rate >= 70)
      return { label: "Geralmente pontual", color: "bg-yellow-500" };
    return { label: "Atrasos frequentes", color: "bg-red-500" };
  };

  // Determinar nível de reputação
  const getReputationLevel = () => {
    if (driver.rating >= 4.8 && driver.punctuality_rate >= 90)
      return "Excelente";
    if (driver.rating >= 4.5 && driver.punctuality_rate >= 80)
      return "Muito Bom";
    if (driver.rating >= 4.0 && driver.punctuality_rate >= 70) return "Bom";
    if (driver.rating >= 3.5 && driver.punctuality_rate >= 60) return "Regular";
    return "Baixo";
  };

  const punctualityBadge = getPunctualityBadge(driver.punctuality_rate);
  const reputationLevel = getReputationLevel();

  // Versão compacta (para lista de motoristas)
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={driver.avatar_url} />
          <AvatarFallback>{(driver.name ?? '?')[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{driver.name ?? 'Motorista'}</p>
            <Badge className={`${punctualityBadge.color} text-white text-xs`}>
              {punctualityBadge.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span className="font-medium text-yellow-500">
                {driver.rating.toFixed(1)}
              </span>
              <span>({driver.total_ratings})</span>
            </div>

            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>{driver.completion_rate.toFixed(0)}%</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>{driver.punctuality_rate.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Versão completa (para detalhes do motorista)
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16 border-2 border-primary">
          <AvatarImage src={driver.avatar_url} />
          <AvatarFallback className="text-xl">{(driver.name ?? '?')[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold">{driver.name ?? 'Motorista'}</h3>
            <Badge variant="outline" className="text-xs">
              {reputationLevel}
            </Badge>
          </div>

          <Badge className={`${punctualityBadge.color} text-white`}>
            {punctualityBadge.label}
          </Badge>

          <p className="text-xs text-muted-foreground mt-2">
            {driver.total_rides} corridas completadas
          </p>
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">Avaliação</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-yellow-500">
              {driver.rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({driver.total_ratings} avaliações)
            </span>
          </div>
        </div>
        <Progress
          value={(driver.rating / 5) * 100}
          className="h-2 [&>div]:bg-yellow-500"
        />
      </div>

      {/* Taxa de Conclusão */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">Taxa de Conclusão</span>
          </div>
          <span className="text-xl font-bold text-green-500">
            {driver.completion_rate.toFixed(1)}%
          </span>
        </div>
        <Progress
          value={driver.completion_rate}
          className="h-2 [&>div]:bg-green-500"
        />
        <p className="text-xs text-muted-foreground">
          Completa as corridas que aceita
        </p>
      </div>

      {/* Taxa de Pontualidade */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Taxa de Pontualidade</span>
          </div>
          <span className="text-xl font-bold text-blue-500">
            {driver.punctuality_rate.toFixed(1)}%
          </span>
        </div>
        <Progress
          value={driver.punctuality_rate}
          className="h-2 [&>div]:bg-blue-500"
        />
        <p className="text-xs text-muted-foreground">
          {driver.on_time_completions || 0} corridas pontuais de{" "}
          {(driver.on_time_completions || 0) +
            (driver.delayed_completions || 0)}{" "}
          total
        </p>
      </div>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary">
            {driver.priority_score.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-lg font-bold text-green-500">
            {driver.total_rides}
          </p>
          <p className="text-xs text-muted-foreground">Corridas</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-blue-500">
            {driver.avg_delay_minutes
              ? `${driver.avg_delay_minutes.toFixed(0)}min`
              : "0min"}
          </p>
          <p className="text-xs text-muted-foreground">Atraso Médio</p>
        </div>
      </div>

      {/* Badges de Destaque */}
      {driver.rating >= 4.8 && driver.punctuality_rate >= 95 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">
                Motorista Premium
              </p>
              <p className="text-xs text-muted-foreground">
                Excelente avaliação e super pontual
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
