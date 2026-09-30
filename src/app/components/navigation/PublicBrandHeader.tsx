import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, MapPin, Menu, Search } from "lucide-react";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import "@/app/pages/TerritoryPortalPage.css";

export function BrandMark() {
  return (
    <span className="pt-brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

interface PublicBrandHeaderProps {
  urls: { nearby: string; business: string; map: string; search: string };
  contextLabel?: string;
  onSearchSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

/** Shared public brand/navigation surface; callers supply their browsing context. */
export function PublicBrandHeader({
  urls,
  contextLabel,
  onSearchSubmit,
}: PublicBrandHeaderProps) {
  return (
    <header className="pt-header">
      <div className="pt-container pt-header-inner">
        <Link className="pt-brand" to="/" aria-label="Achegue-se — início">
          <BrandMark />
          <strong>achegue-se</strong>
        </Link>
        <nav aria-label="Navegação principal">
          <Link to={urls.nearby}>Por perto</Link>
          <Link to="/como-funciona">Como funciona</Link>
          <Link to={urls.business}>Para negócios</Link>
        </nav>
        <form
          className="pt-search"
          action={urls.search}
          onSubmit={onSearchSubmit}
          role="search"
        >
          <Search aria-hidden="true" />
          <input
            name="q"
            aria-label="Buscar empresas e lugares"
            placeholder="Buscar empresas e lugares..."
          />
        </form>
        {contextLabel ? (
          <Link className="pt-location" to={urls.map}>
            <MapPin aria-hidden="true" />
            {contextLabel}
            <ChevronDown aria-hidden="true" />
          </Link>
        ) : null}
        <Link className="pt-login" to={AUTH_PATHS.login}>
          Entrar <ArrowRight aria-hidden="true" />
        </Link>
        <details className="pt-mobile-menu">
          <summary aria-label="Abrir menu">
            <Menu aria-hidden="true" />
          </summary>
          <nav aria-label="Menu principal">
            <Link to={urls.nearby}>Por perto</Link>
            <Link to="/como-funciona">Como funciona</Link>
            <Link to={urls.business}>Empresas</Link>
            <Link to={urls.map}>Mapa do território</Link>
            <Link to={urls.search}>Busca</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
