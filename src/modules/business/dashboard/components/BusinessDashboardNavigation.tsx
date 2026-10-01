import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, Menu } from "lucide-react";
import "../pages/BusinessDashboardNav.css";

/** Presentation shared by the private Central and its isolated previews. */
export function BusinessDashboardNavigation({
  children,
  count,
  sectionLabel,
}: {
  children: ReactNode;
  count: number;
  sectionLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigationId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  return (
    <aside
      className="business-dashboard-navigation"
      aria-label="Navegação da empresa"
      data-expanded={expanded}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !expanded) return;
        const toggle = toggleRef.current;
        if (!toggle || getComputedStyle(toggle).display === "none") return;
        event.preventDefault();
        event.stopPropagation();
        setExpanded(false);
        toggle.focus();
      }}
    >
      <div className="business-dashboard-navigation__heading">
        <strong>Central da empresa</strong>
        <p>Gerencie sua presença no território.</p>
      </div>
      <button
        ref={toggleRef}
        className="business-dashboard-navigation__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={navigationId}
        onClick={() => setExpanded((value) => !value)}
      >
        <Menu size={18} aria-hidden="true" />
        {sectionLabel ?? "Gerenciar empresa"}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <nav
        id={navigationId}
        aria-label="Seções da empresa"
        className="business-dashboard-nav"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) setExpanded(false);
        }}
        style={{ "--business-nav-count": count } as CSSProperties}
      >
        {children}
      </nav>
    </aside>
  );
}
