import React from "react";
import { AlertTriangle, Calendar, Clock, Landmark, MapPin, Navigation, Store } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import type { NearbyEntity } from "../hooks/useNearbyEntities";

interface NearbyCardProps {
  entity: NearbyEntity;
  onNavigate: (url: string) => void;
}

const ENTITY_CONFIG = {
  business: { label: "Empresa", baseUrl: buildAppModulePath(APP_MODULE_SLUGS.business), icon: Store, color: "bg-blue-500" },
  event: { label: "Evento", baseUrl: buildAppModulePath(APP_MODULE_SLUGS.events), icon: Calendar, color: "bg-green-500" },
  alert: { label: "Alerta", baseUrl: buildAppModulePath(APP_MODULE_SLUGS.communityAlerts), icon: AlertTriangle, color: "bg-red-500" },
  tourist_point: {
    label: "Ponto turistico",
    baseUrl: buildAppModulePath(APP_MODULE_SLUGS.touristPoints),
    icon: Landmark,
    color: "bg-purple-500",
  },
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function getWalkingTime(meters: number): string {
  const minutes = Math.round(meters / 83);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function NearbyCard({ entity, onNavigate }: NearbyCardProps) {
  const config = ENTITY_CONFIG[entity.type];
  const Icon = config.icon;
  const hasRealDistance = entity.distance > 0 && entity.distance < 100000;
  const neighborhood =
    typeof entity.metadata?.neighborhood === "string" ? entity.metadata.neighborhood : null;
  const city = typeof entity.metadata?.city === "string" ? entity.metadata.city : null;
  const territoryName = neighborhood || city || null;
  const isService = entity.metadata?.category === "services" || entity.metadata?.is_mobile_service;

  const url = React.useMemo(() => {
    if ((entity.type === "business" || entity.type === "event") && entity.metadata?.slug) {
      return `${config.baseUrl}/${entity.metadata.slug}`;
    }
    if (entity.type === "tourist_point") {
      return `${config.baseUrl}/${entity.metadata?.slug || entity.id}`;
    }
    return `${config.baseUrl}/${entity.id}`;
  }, [config.baseUrl, entity.id, entity.metadata?.slug, entity.type]);

  return (
    <Card
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
      onClick={() => onNavigate(url)}
    >
      <div className="relative p-4">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-3 rounded-xl ${config.color} text-white shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {entity.name}
              </h3>
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {isService ? "Servico" : config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {hasRealDistance ? (
                <>
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Navigation className="h-4 w-4" />
                    <span>{formatDistance(entity.distance)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getWalkingTime(entity.distance)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{territoryName || "na regiao"}</span>
                </div>
              )}
              {isService && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  Atende na regiao
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
