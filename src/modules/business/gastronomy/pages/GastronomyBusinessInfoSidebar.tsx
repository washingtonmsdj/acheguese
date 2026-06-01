import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsAppUrl,
} from "@/shared/utils/contactLinks";
import { cn } from "@/shared/utils/cn";

type GastronomyBusinessInfo = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  fotos?: string[];
  address?: {
    latitude?: number;
    longitude?: number;
  };
  location?: {
    full_name?: string;
  };
  gastronomy_profile: {
    accepts_reservations: boolean;
    has_parking: boolean;
    has_wifi: boolean;
    has_accessibility: boolean;
    has_kids_area: boolean;
    has_live_music: boolean;
  };
};

type OpeningStatus = {
  isOpen: boolean;
  statusText: string;
  dotColor: "green" | "red" | "yellow";
};

type BusinessInfoSidebarProps = {
  business: GastronomyBusinessInfo;
  openingStatus: OpeningStatus | null;
  onNavigate: () => void;
};

export function GastronomyBusinessInfoSidebar({
  business,
  openingStatus,
  onNavigate,
}: BusinessInfoSidebarProps) {
  const profile = business.gastronomy_profile;
  const hasCoords =
    typeof business.address?.latitude === "number" &&
    typeof business.address?.longitude === "number";

  const featureLabels = [
    profile.accepts_reservations && "Aceita reservas",
    profile.has_parking && "Estacionamento",
    profile.has_wifi && "Wi-Fi",
    profile.has_accessibility && "Acessivel",
    profile.has_kids_area && "Area kids",
    profile.has_live_music && "Musica ao vivo",
  ].filter(Boolean) as string[];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
          <Phone className="h-4 w-4" />
          Contato
        </h3>

        <div className="space-y-3">
          {business.phone && (
            <a
              href={buildTelUrl(business.phone) ?? undefined}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium text-foreground">{business.phone}</p>
              </div>
            </a>
          )}

          {business.whatsapp && (
            <a
              href={buildWhatsAppUrl(business.whatsapp) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15">
                <MessageCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-medium text-success">{business.whatsapp}</p>
              </div>
            </a>
          )}

          {business.email && (
            <a
              href={buildMailtoUrl(business.email) ?? undefined}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{business.email}</p>
              </div>
            </a>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {business.whatsapp && (
            <Button
              asChild
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <a
                href={buildWhatsAppUrl(business.whatsapp) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
          {business.phone && (
            <Button variant="outline" asChild>
              <a href={buildTelUrl(business.phone) ?? undefined}>
                <Phone className="mr-2 h-4 w-4" />
                Ligar
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
          <Clock className="h-4 w-4" />
          Horario de funcionamento
        </h3>

        {openingStatus ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-3 w-3 rounded-full animate-pulse",
                openingStatus.dotColor === "green" && "bg-success",
                openingStatus.dotColor === "red" && "bg-destructive",
                openingStatus.dotColor === "yellow" && "bg-warning",
              )}
            />
            <span
              className={cn(
                "font-medium",
                openingStatus.isOpen ? "text-success" : "text-warning",
              )}
            >
              {openingStatus.statusText}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Consulte pelo telefone</p>
        )}
      </div>

      {featureLabels.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-card-foreground">Comodidades</h3>
          <div className="flex flex-wrap gap-2">
            {featureLabels.map((label) => (
              <Badge key={label} variant="secondary" className="px-2 py-1">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasCoords && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
            <MapPin className="h-4 w-4" />
            Localizacao
          </h3>
          {business.location?.full_name && (
            <p className="mb-3 text-sm text-muted-foreground">
              {business.location.full_name}
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={onNavigate}>
            <MapPin className="mr-2 h-4 w-4" />
            Como chegar
          </Button>
        </div>
      )}
    </div>
  );
}
