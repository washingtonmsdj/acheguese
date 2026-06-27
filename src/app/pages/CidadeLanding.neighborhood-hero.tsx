import { Link } from "react-router-dom";
import {
  Globe2,
  Lock,
  MapPin,
  PencilLine,
  Users,
} from "lucide-react";

import type { MapMarker, TerritoryPolygon } from "@/core/maps";
import { NeighborhoodTerritoryArt } from "@/core/community/components/public/NeighborhoodTerritoryArt";

type NeighborhoodTerritoryHeroProps = {
  territoryName: string;
  cityName: string;
  stateLabel: string;
  isGroup: boolean;
  memberCount: number;
  polygons: TerritoryPolygon[];
  markers: MapMarker[];
  enterHref: string;
  interactionHref: string;
  canInteract: boolean;
};

export function NeighborhoodTerritoryHero({
  territoryName,
  cityName,
  stateLabel,
  isGroup,
  memberCount,
  polygons,
  markers,
  enterHref,
  interactionHref,
  canInteract,
}: NeighborhoodTerritoryHeroProps) {
  const territoryContextLabel = isGroup ? `${memberCount} áreas conectadas` : `${cityName}, ${stateLabel}`;

  return (
    <section className="neighborhood-community-hero neighborhood-community-hero-territorial" aria-label={`Comunidade pública de ${territoryName}`}>
      <div className="neighborhood-community-hero-copy">
        <span className="neighborhood-community-eyebrow">
          <MapPin aria-hidden="true" />
          {territoryName.toUpperCase()}
        </span>
        <h1>Meu bairro</h1>
        <p>Comunidade, serviços e negócios perto de você.</p>
        <div className="neighborhood-community-badges">
          <span>
            <Globe2 aria-hidden="true" />
            Leitura pública
          </span>
          <span>
            <Users aria-hidden="true" />
            Moradores verificados
          </span>
        </div>
        <div className="neighborhood-community-rules">
          <span>
            <MapPin aria-hidden="true" />
            {territoryContextLabel}
          </span>
          <span>
            <Lock aria-hidden="true" />
            Para publicar, confirme sua moradia
          </span>
        </div>
        <div className="neighborhood-community-hero-actions">
          <Link to={enterHref}>
            <Users aria-hidden="true" />
            Entrar no bairro
          </Link>
          <Link to={interactionHref} aria-label={canInteract ? "Publicar no bairro" : "Entrar ou verificar moradia para publicar"}>
            <PencilLine aria-hidden="true" />
            Publicar
          </Link>
        </div>
      </div>

      <div className="neighborhood-community-hero-map" aria-hidden="true">
        <NeighborhoodTerritoryArt polygons={polygons} markers={markers} decorative />
      </div>
    </section>
  );
}
