import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { USER_ROLE } from "@/shared/types/constants";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
const routeNames: Record<string, string> = {
  "": "Feed",
  businesss: "Empresas",
  services: "Serviços",
  classificados: "Classificados",
  eventos: "Eventos",
  cupons: "Cupons",
  mapa: "Mapa",
  profile: "Perfil",
  mensagens: "Mensagens",
  ranking: "Ranking",
  busca: "Buscar",
  "novo-post": "Novo Post",
  "achados-perdidos": "Achados e Perdidos",
  recomendacoes: "Recomendações",
  [USER_ROLE.ADMIN]: "Administração",
};

export function Breadcrumbs() {
  const location = useLocation();
  const urls = useFriendlyModuleUrls();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Não mostrar breadcrumbs na home
  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      <Link
        to={urls.landing}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Início</span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const displayName =
          routeNames[name] || name.charAt(0).toUpperCase() + name.slice(1);

        return (
          <div key={routeTo} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium text-foreground">{displayName}</span>
            ) : (
              <Link
                to={routeTo}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
