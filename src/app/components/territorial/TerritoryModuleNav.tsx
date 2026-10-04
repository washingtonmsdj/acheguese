import { useEffect, useRef, type ComponentType } from "react";
import { Link } from "react-router-dom";

export interface TerritoryModuleNavItem {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}

export interface TerritoryModuleNavProps {
  items: readonly TerritoryModuleNavItem[];
  activeModule: string;
}

const ACTIVE_MVP_NAV_IDS = ["business", "nearby", "map", "search"] as const;

export function TerritoryModuleNav({
  items,
  activeModule,
}: TerritoryModuleNavProps) {
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    const frame = window.requestAnimationFrame(() => {
      const activeItem = navigation.querySelector<HTMLElement>("[aria-current='page']");
      if (!activeItem || navigation.scrollWidth <= navigation.clientWidth) return;
      const left = activeItem.offsetLeft - (navigation.clientWidth - activeItem.offsetWidth) / 2;
      navigation.scrollTo({ left: Math.max(0, left), behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeModule]);

  const activeItems = ACTIVE_MVP_NAV_IDS.flatMap((id) =>
    items.filter((item) => item.id === id),
  );

  return (
    <div className="tmh-nav tmh-nav--mvp" aria-label="Atalhos do território" ref={navigationRef}>
      {activeItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className={`tmh-nav__item${item.id === activeModule ? " tmh-nav__item--active" : ""}`}
            to={item.href}
            key={item.id}
            aria-current={item.id === activeModule ? "page" : undefined}
          >
            <Icon />
            <span>
              <strong>{item.id === "search" ? "Buscar" : item.label}</strong>
              <small>{item.description}</small>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
