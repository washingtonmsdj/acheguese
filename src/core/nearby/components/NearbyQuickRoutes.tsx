import { Navigation, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { NearbyBusiness } from "@/core/nearby/domain/types";
import {
  formatNearbyDistance,
  formatNearbyTerritoryDistance,
} from "@/core/nearby/utils/nearbyDistance";

interface NearbyQuickRoutesProps {
  businesses: readonly NearbyBusiness[];
  precise: boolean;
}

export function NearbyQuickRoutes({
  businesses,
  precise,
}: NearbyQuickRoutesProps) {
  const navigate = useNavigate();

  return (
    <section className="nb-routes">
      <header className="nb-section-heading">
        <div>
          <Navigation />
          <span>
            <h2>Rotas rápidas</h2>
            <p>Atalhos para os primeiros resultados.</p>
          </span>
        </div>
      </header>
      <div>
        {businesses.slice(0, 4).map((business) => (
          <button
            type="button"
            key={business.id}
            onClick={() => navigate(business.canonicalUrl)}
          >
            <span>
              {business.logo ? <img src={business.logo} alt="" /> : <Store />}
            </span>
            <strong>{business.name}</strong>
            <small>
              {precise
                ? formatNearbyDistance(business.distanceMeters)
                : formatNearbyTerritoryDistance(business.distanceMeters)}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
