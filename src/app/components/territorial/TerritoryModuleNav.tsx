import { useEffect, useRef, type ComponentType } from "react";
import { Link } from "react-router-dom";

export interface TerritoryModuleNavItem {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

export interface TerritoryModuleNavMoreItem {
  label: string;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

export interface TerritoryModuleNavProps {
  items: readonly TerritoryModuleNavItem[];
  activeModule: string;
  moreItems?: readonly TerritoryModuleNavMoreItem[];
}

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

  return (
    <div className="tmh-nav tmh-nav--mvp" aria-label="Atalhos do território" ref={navigationRef}>
      {["business", "nearby", "map", "search"].flatMap((id) => items.filter((item) => item.id === id && item.href && !item.disabled)).map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon />
            <span>
              <strong>{item.id === "search" ? "Buscar" : item.label}</strong>
              <small>{item.description}</small>
            </span>
            {item.disabled || item.badge ? <b>{item.badge ?? "Em breve"}</b> : null}
          </>
        );

        if (item.disabled || !item.href) {
          return (
            <div className="tmh-nav__item tmh-nav__item--disabled" aria-disabled="true" key={item.id}>
              {content}
            </div>
          );
        }

        return (
          <Link
            className={`tmh-nav__item${item.id === activeModule ? " tmh-nav__item--active" : ""}`}
            to={item.href}
            key={item.id}
            aria-current={item.id === activeModule ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}

    </div>
  );
}
