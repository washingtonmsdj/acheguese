import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Store } from "lucide-react";
import type { Business } from "@/core/business/types/Business";
import { resolveMediaAssetSource } from "@/shared/media/mediaAssetReference";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import "./BusinessManagementIdentity.css";
import { getBusinessStatusPresentation } from "../presentation/businessStatusPresentation";

export type BusinessManagementIdentityData = Pick<Business, "name"> &
  Partial<
    Pick<
      Business,
      | "logo_url"
      | "category"
      | "status"
      | "location"
      | "business_city"
      | "business_state"
    >
  >;

export function BusinessManagementIdentity({
  business,
  publicUrl,
}: {
  business: BusinessManagementIdentityData;
  publicUrl?: string | null;
}) {
  const image = resolveMediaAssetSource(business.logo_url);
  const statusPresentation = business.status
    ? getBusinessStatusPresentation(business.status)
    : null;
  const location = [
    business.location?.name,
    business.business_city,
    business.business_state,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section
      className="business-management-identity"
      aria-label="Empresa em gestão"
    >
      <div className="business-management-identity__image">
        {image ? <img src={image} alt="" /> : <Store aria-hidden="true" />}
      </div>
      <div className="business-management-identity__copy">
        <strong>{business.name}</strong>
        <div className="business-management-identity__badges">
          {business.category ? (
            <span>{getBusinessCategoryLabel(business.category)}</span>
          ) : null}
          {statusPresentation ? (
            <span className={statusPresentation.badgeClassName}>
              {statusPresentation.label}
            </span>
          ) : null}
        </div>
        {location ? (
          <p>
            <MapPin size={14} aria-hidden="true" />
            {location}
          </p>
        ) : null}
      </div>
      {publicUrl && business.status === "active" ? (
        <Link to={publicUrl}>
          Ver página pública <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}
