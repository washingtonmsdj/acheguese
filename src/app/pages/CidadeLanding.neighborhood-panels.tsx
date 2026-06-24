import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Home,
  Share2,
  ShieldCheck,
  Store,
  Users,
  Wrench,
} from "lucide-react";

import type { Post } from "@/core/posts/types";
import { formatMetric } from "./CidadeLanding.constants";
import { formatRelativeTime, getTextPreview, withQueryParams } from "./CidadeLanding.utils";

export type NeighborhoodAccessStatus = "visitor" | "unverified" | "verified";

export type PopulationMetric = {
  value?: number;
  sourceLabel: string;
};

export function NeighborhoodGateCard({
  status,
  loading,
  actionHref,
}: {
  status: NeighborhoodAccessStatus;
  loading: boolean;
  actionHref: string;
}) {
  const copy = loading
    ? {
        title: "Verificando moradia",
        description: "Estamos conferindo sua residência principal para liberar interações do bairro.",
        action: "Abrir conta",
      }
    : status === "verified"
      ? {
          title: "Moradia verificada",
          description: "Você pode publicar, comentar, recomendar e participar dos grupos deste bairro.",
          action: "Publicar no bairro",
        }
      : status === "unverified"
        ? {
            title: "Morar aqui libera publicação e grupos",
            description: "Confirme seu endereço para participar como morador verificado.",
            action: "Verificar moradia",
          }
        : {
            title: "Entrar libera comentários e recomendações",
            description: "A leitura é pública. Para interagir, entre e confirme sua moradia.",
            action: "Entrar no bairro",
          };

  return (
    <section className="neighborhood-community-card neighborhood-community-gate" aria-label={copy.title}>
      <span aria-hidden="true">
        <Home />
      </span>
      <div>
        <strong>{copy.title}</strong>
        <small>{copy.description}</small>
      </div>
      <Link to={actionHref}>{copy.action}</Link>
    </section>
  );
}

export function NeighborhoodStatsPanel({
  population,
  businessCount,
  servicesCount,
}: {
  population: PopulationMetric;
  businessCount: number;
  servicesCount: number;
}) {
  const stats = [
    {
      label: "moradores",
      value: population.value ? formatMetric(population.value) : "IBGE pendente",
      detail: population.sourceLabel,
      icon: Users,
    },
    { label: "negócios", value: formatMetric(businessCount), detail: "cadastros ativos", icon: Store },
    { label: "serviços", value: formatMetric(servicesCount), detail: "profissionais", icon: Wrench },
  ];

  return (
    <section className="neighborhood-community-card neighborhood-community-stats" aria-label="Estatísticas do bairro">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <span key={stat.label}>
            <Icon aria-hidden="true" />
            <strong>{stat.value}</strong>
            <small>
              {stat.label}
              <em>{stat.detail}</em>
            </small>
          </span>
        );
      })}
    </section>
  );
}

export function NeighborhoodAlertsPanel({
  alerts,
  alertsHref,
  actionHref,
}: {
  alerts: Post[];
  alertsHref: string;
  actionHref: string;
}) {
  return (
    <section className="neighborhood-community-card neighborhood-community-alerts" aria-labelledby="neighborhood-community-alerts-title">
      <div className="city-op-panel-heading">
        <h2 id="neighborhood-community-alerts-title">Alertas do bairro</h2>
        <Link to={alertsHref}>Ver todos</Link>
      </div>
      <div className="neighborhood-community-alert-list">
        {alerts.length > 0 ? (
          alerts.slice(0, 2).map((alert) => (
            <Link key={alert.id} to={withQueryParams(alertsHref, { post: alert.id })}>
              <AlertTriangle aria-hidden="true" />
              <span>
                <strong>{getTextPreview(alert.content, 72)}</strong>
                <small>{formatRelativeTime(alert.created_at)}</small>
              </span>
            </Link>
          ))
        ) : (
          <span className="neighborhood-community-empty-alert">
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Sem alertas públicos agora</strong>
              <small>Alertas oficiais e avisos de moradores aparecem aqui.</small>
            </span>
          </span>
        )}
      </div>
      <Link to={actionHref} className="neighborhood-community-alert-action">
        <Share2 aria-hidden="true" />
        Enviar alerta ou informação
      </Link>
    </section>
  );
}
