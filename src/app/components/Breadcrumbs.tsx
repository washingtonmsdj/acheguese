import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { USER_ROLE } from "@/shared/types/constants";

const routeNames: Record<string, string> = {
  "": "Feed",
  empresas: "Empresas",
  services: "Serviços",
  classificados: "Classificados",
  eventos: "Eventos",
  cupons: "Cupons",
  mapa: "Mapa",
  perfil: "Perfil",
  mobilidade: "Mobilidade",
  motorista: "Motorista",
  motoboy: "Motoboy",
  corridas: "Corridas",
  entregas: "Entregas",
  cadastro: "Cadastro",
  disponibilidade: "Disponibilidade",
  ganhos: "Ganhos",
  configuracoes: "Configuracoes",
  profile: "Perfil",
  mensagens: "Mensagens",
  ranking: "Ranking",
  busca: "Buscar",
  "novo-post": "Novo Post",
  "achados-perdidos": "Achados e Perdidos",
  recomendacoes: "Recomendações",
  [USER_ROLE.ADMIN]: "Administração",
};

function resolveRouteName(name: string): string | undefined {
  switch (name) {
    case "":
      return routeNames[""];
    case "empresas":
      return routeNames.empresas;
    case "services":
      return routeNames.services;
    case "classificados":
      return routeNames.classificados;
    case "eventos":
      return routeNames.eventos;
    case "cupons":
      return routeNames.cupons;
    case "mapa":
      return routeNames.mapa;
    case "perfil":
      return routeNames.perfil;
    case "mobilidade":
      return routeNames.mobilidade;
    case "motorista":
      return routeNames.motorista;
    case "motoboy":
      return routeNames.motoboy;
    case "corridas":
      return routeNames.corridas;
    case "entregas":
      return routeNames.entregas;
    case "cadastro":
      return routeNames.cadastro;
    case "disponibilidade":
      return routeNames.disponibilidade;
    case "ganhos":
      return routeNames.ganhos;
    case "configuracoes":
      return routeNames.configuracoes;
    case "profile":
      return routeNames.profile;
    case "mensagens":
      return routeNames.mensagens;
    case "ranking":
      return routeNames.ranking;
    case "busca":
      return routeNames.busca;
    case "novo-post":
      return routeNames["novo-post"];
    case "achados-perdidos":
      return routeNames["achados-perdidos"];
    case "recomendacoes":
      return routeNames.recomendacoes;
    case USER_ROLE.ADMIN:
      return routeNames[USER_ROLE.ADMIN];
    default:
      return undefined;
  }
}

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Não mostrar breadcrumbs na home
  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      <Link
        to="/"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Início</span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const mappedName = resolveRouteName(name);
        const displayName = mappedName || name.charAt(0).toUpperCase() + name.slice(1);

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
