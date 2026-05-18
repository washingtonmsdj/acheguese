import type React from "react";
import {
  Building2,
  BadgeCheck,
  Compass,
  Loader2,
  MapPin,
  Star,
  UserCheck,
  Utensils,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDistance } from "@/shared/utils/geolocation";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type { TouristPoint } from "@/modules/guide/tourist-points";
import { useNearbyBusinesses, useNearbyGuides } from "@/modules/guide/tourist-points/hooks/useNearbyBusinesses";

const BUSINESS_CATEGORY_LABELS: Record<string, string> = {
  restaurante: "Restaurante",
  lazer: "Lazer & Turismo",
  servicos: "Serviços",
  mercado: "Mercado",
  farmacia: "Farmácia",
  saude: "Saúde",
  educacao: "Educação",
  outros: "Outros",
};

const BUSINESS_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  restaurante: <Utensils className="h-3.5 w-3.5" />,
  lazer: <Compass className="h-3.5 w-3.5" />,
  servicos: <Building2 className="h-3.5 w-3.5" />,
};

export function NearbyBusinessesSection({ point }: { point: TouristPoint }) {
  const lat = point.address?.latitude ?? point.latitude ?? null;
  const lng = point.address?.longitude ?? point.longitude ?? null;
  const { data: businesses = [], isLoading } = useNearbyBusinesses(lat, lng);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Empresas e Serviços Próximos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (businesses.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Empresas e Serviços Próximos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {businesses.map((biz) => (
            <a
              key={biz.id}
              href={biz.slug && biz.geographic_path
                ? BusinessUrlService.getCanonicalUrl({
                    id: biz.profile_id || biz.id,
                    slug: biz.slug,
                    is_premium: biz.is_premium,
                    geographic_path: biz.geographic_path,
                  })
                : "#"}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              {biz.logo_url ? (
                <img
                  src={biz.logo_url}
                  alt={biz.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-muted"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  {BUSINESS_CATEGORY_ICONS[biz.category] ?? <Building2 className="h-5 w-5" />}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {biz.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {BUSINESS_CATEGORY_LABELS[biz.category] ?? biz.category}
                  </span>
                  {biz.distanceMeters !== undefined && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {formatDistance(biz.distanceMeters)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {biz.rating > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-warning flex-shrink-0">
                  <Star className="h-3 w-3 fill-warning" />
                  {biz.rating.toFixed(1)}
                </div>
              )}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function NearbyGuidesSection({ point }: { point: TouristPoint }) {
  const lat = point.address?.latitude ?? point.latitude ?? null;
  const lng = point.address?.longitude ?? point.longitude ?? null;
  const { data: guides = [], isLoading } = useNearbyGuides(lat, lng);

  if (isLoading) return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Guias de Turismo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  if (guides.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Guias de Turismo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {guides.map((guide) => (
            <a
              key={guide.id}
              href={guide.slug && guide.geographic_path
                ? BusinessUrlService.getCanonicalUrl({
                    id: guide.profile_id || guide.id,
                    slug: guide.slug,
                    is_premium: guide.is_premium,
                    geographic_path: guide.geographic_path,
                  })
                : "#"}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              {guide.logo_url ? (
                <img src={guide.logo_url} alt={guide.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-muted" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  <UserCheck className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {guide.name}
                </p>
                {guide.especialidades?.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {guide.especialidades.slice(0, 2).join(" · ")}
                  </p>
                )}
                {guide.distanceMeters !== undefined && (
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(guide.distanceMeters)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {guide.rating > 0 && (
                  <div className="flex items-center gap-0.5 text-xs text-warning">
                    <Star className="h-3 w-3 fill-warning" />
                    {guide.rating.toFixed(1)}
                  </div>
                )}
                {guide.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-primary" />
                )}
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
