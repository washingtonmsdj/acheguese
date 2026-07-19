import { Link } from "react-router-dom";
import {
  Globe2,
  Lock,
  MapPin,
  PencilLine,
  Users,
} from "lucide-react";

import type { MapMarker, TerritoryPolygon } from "@/core/maps";
import { NeighborhoodTerritoryArt } from "@/core/community-feed/components/public/NeighborhoodTerritoryArt";

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
  isCommunityMode: boolean;
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
  isCommunityMode,
}: NeighborhoodTerritoryHeroProps) {
  const territoryContextLabel = isGroup ? `${memberCount} areas conectadas` : `${cityName}, ${stateLabel}`;
  const title = isCommunityMode ? "Meu bairro" : territoryName;
  const description = isCommunityMode
    ? "Comunidade, servicos e negocios perto de voce."
    : `Empresas, servicos, classificados e mapa local em ${cityName}.`;
  const ariaLabel = isCommunityMode
    ? `Comunidade publica de ${territoryName}`
    : `Territorio publico de ${territoryName}`;
  const primaryActionLabel = isCommunityMode ? "Entrar no bairro" : "Abrir portal comunitario";
  const interactionActionLabel = isCommunityMode ? "Publicar" : "Publicar no portal comunitario";

  return (
    <section className="neighborhood-community-hero neighborhood-community-hero-territorial" aria-label={ariaLabel}>
      <div className="neighborhood-community-hero-copy">
        <span className="neighborhood-community-eyebrow">
          <MapPin aria-hidden="true" />
          {territoryName.toUpperCase()}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="neighborhood-community-badges">
          <span>
            <Globe2 aria-hidden="true" />
            {isCommunityMode ? "Leitura publica" : "Pagina publica"}
          </span>
          <span>
            <Users aria-hidden="true" />
            {isCommunityMode ? "Moradores verificados" : "Rotas publicas"}
          </span>
        </div>
        <div className="neighborhood-community-rules">
          <span>
            <MapPin aria-hidden="true" />
            {territoryContextLabel}
          </span>
          <span>
            <Lock aria-hidden="true" />
            {isCommunityMode ? "Para publicar, confirme sua moradia" : "Interacoes ficam no portal comunitario"}
          </span>
        </div>
        <div className="neighborhood-community-hero-actions">
          <Link to={enterHref}>
            <Users aria-hidden="true" />
            {primaryActionLabel}
          </Link>
          <Link
            to={interactionHref}
            aria-label={canInteract ? "Publicar no bairro" : "Entrar ou verificar moradia para publicar"}
          >
            <PencilLine aria-hidden="true" />
            {interactionActionLabel}
          </Link>
        </div>
      </div>

      <div className="neighborhood-community-hero-map" aria-hidden="true">
        <NeighborhoodTerritoryArt polygons={polygons} markers={markers} decorative />
      </div>
    </section>
  );
}
