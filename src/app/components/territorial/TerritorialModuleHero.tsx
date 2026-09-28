import type { ComponentType, ReactNode } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { TerritoryModuleNav, type TerritoryModuleNavItem, type TerritoryModuleNavMoreItem } from "./TerritoryModuleNav";
import "./TerritorialModuleHero.css";

export interface TerritorialHeroBreadcrumb {
  label: string;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface TerritorialModuleHeroProps {
  territory: string;
  module: string;
  activeModule?: string;
  eyebrow?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  iconPlacement?: "eyebrow" | "title";
  title: string;
  description: string;
  breadcrumbs: readonly TerritorialHeroBreadcrumb[];
  backgroundImage: string;
  navItems: readonly TerritoryModuleNavItem[];
  moreNavItems?: readonly TerritoryModuleNavMoreItem[];
}

export function TerritorialModuleHero({
  territory,
  module,
  activeModule = module,
  eyebrow,
  icon: Icon,
  iconPlacement = "eyebrow",
  title,
  description,
  breadcrumbs,
  backgroundImage,
  navItems,
  moreNavItems,
}: TerritorialModuleHeroProps) {
  const TitleIcon = Icon && iconPlacement === "title" ? Icon : null;
  const EyebrowIcon = Icon && iconPlacement === "eyebrow" ? Icon : null;
  const mobileContext = module === "home"
    ? breadcrumbs.find((breadcrumb) => breadcrumb.label !== territory)?.label ?? territory
    : territory;
  const ContextIcon = module === "home" ? Home : ArrowLeft;

  return (
    <section className={`tmh tmh--${module}`} data-module={module} aria-labelledby="territorial-module-hero-title">
      <img className="tmh__image" src={backgroundImage} alt={`Vista e moradores de ${territory}`} width="1536" height="1024" />
      <div className="tmh__overlay" aria-hidden="true" />
      <div className="tmh__inner">
        <nav className="tmh__breadcrumbs" aria-label="Navegação estrutural">
          <span className="tmh__breadcrumbs-mobile"><ContextIcon aria-hidden="true" /> {mobileContext}</span>
          <span className="tmh__breadcrumbs-desktop">
            {breadcrumbs.map((breadcrumb, index) => {
              const BreadcrumbIcon = breadcrumb.icon ?? (index === 0 ? Home : null);
              const content = <>{BreadcrumbIcon ? <BreadcrumbIcon /> : null}<span>{breadcrumb.label}</span></>;
              return breadcrumb.href ? <Link to={breadcrumb.href} key={`${breadcrumb.label}-${index}`}>{content}</Link> : <span key={`${breadcrumb.label}-${index}`}>{content}</span>;
            })}
          </span>
        </nav>

        {eyebrow ? <p className="tmh__eyebrow">{EyebrowIcon ? <EyebrowIcon /> : null}{eyebrow}</p> : null}

        <div className={`tmh__title-group${TitleIcon ? " tmh__title-group--icon" : ""}`}>
          {TitleIcon ? <span className="tmh__title-icon" aria-hidden="true"><TitleIcon /></span> : null}
          <div>
            <h1 id="territorial-module-hero-title">{title}</h1>
            <p className="tmh__description">{description}</p>
          </div>
        </div>

        <TerritoryModuleNav items={navItems} activeModule={activeModule} moreItems={moreNavItems} />
      </div>
    </section>
  );
}

export { TerritoryModuleNav } from "./TerritoryModuleNav";
export type { TerritoryModuleNavItem, TerritoryModuleNavMoreItem } from "./TerritoryModuleNav";
