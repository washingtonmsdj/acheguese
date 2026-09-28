import { useEffect, useRef, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

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
  moreItems = [],
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
    <div className="tmh-nav" aria-label="Atalhos do território" ref={navigationRef}>
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon />
            <span>
              <strong>{item.label}</strong>
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

      {moreItems.length ? (
        <details className="tmh-nav__more">
          <summary aria-label="Abrir mais páginas"><Menu /><strong>Mais</strong></summary>
          <nav aria-label="Mais páginas do território">
            {moreItems.map((item) => {
              const content = <><span>{item.label}</span>{item.disabled || item.badge ? <b>{item.badge ?? "Em breve"}</b> : null}</>;
              return item.disabled || !item.href ? (
                <span className="tmh-nav__more-item tmh-nav__more-item--disabled" key={item.label}>{content}</span>
              ) : (
                <Link className="tmh-nav__more-item" to={item.href} key={item.label}>{content}</Link>
              );
            })}
          </nav>
        </details>
      ) : null}
    </div>
  );
}
