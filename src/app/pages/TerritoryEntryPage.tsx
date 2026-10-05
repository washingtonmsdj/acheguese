import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AUTH_PATHS, buildLoginPath } from "@/core/auth/constants/authFlow";
import { getStateByCode } from "@/core/location/data/brazilianStates";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  getPublicTerritoryGroupPresentation,
  getPublicTerritoryLocationLabel,
  resolvePublicTerritoryFallback,
} from "@/core/routing/utils/publicTerritoryFallbacks";
import { PRIVACY_POLICY_PATH } from "@/shared/constants/legal";
import "./TerritoryEntryPage.css";

const LAUNCH_STATE = TERRITORY_CONFIG.launch.state;
const LAUNCH_CITY = TERRITORY_CONFIG.launch.city;
const LAUNCH_COMMUNITY_SLUG = TERRITORY_CONFIG.launch.community.slug;
const LAUNCH_COMMUNITY_NAME = TERRITORY_CONFIG.launch.community.name;
const LAUNCH_COMMUNITY_DISCOVERY_LABEL = LAUNCH_COMMUNITY_NAME.replace(/^Complexo do /, "");
const LAUNCH_STATE_LABEL =
  getStateByCode(LAUNCH_STATE)?.name ?? LAUNCH_STATE.toLocaleUpperCase("pt-BR");
const LAUNCH_PLACE_LABEL = [TERRITORY_CONFIG.launch.name, LAUNCH_STATE_LABEL]
  .filter(Boolean)
  .join(" · ");

const launchBusinessUrl = LAUNCH_URLS.business;
const launchMapUrl = LAUNCH_URLS.map;
const launchNearbyUrl = LAUNCH_URLS.nearby;
const launchSearchUrl = LAUNCH_URLS.search;

const launchTerritory = resolvePublicTerritoryFallback({
  state: LAUNCH_STATE,
  city: LAUNCH_CITY,
  territorySlug: LAUNCH_COMMUNITY_SLUG,
});
const launchCommunityMembers =
  launchTerritory?.kind === "group" ? launchTerritory.group.members : [];
const launchCommunityPresentation =
  launchTerritory?.kind === "group"
    ? getPublicTerritoryGroupPresentation(launchTerritory.group)
    : { label: LAUNCH_COMMUNITY_NAME, article: null };
const launchCommunityGenitiveLabel =
  launchCommunityPresentation.article === "o"
    ? `do ${LAUNCH_COMMUNITY_NAME}`
    : launchCommunityPresentation.article === "a"
      ? `da ${LAUNCH_COMMUNITY_NAME}`
      : `de ${LAUNCH_COMMUNITY_NAME}`;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function BrandMark() {
  return (
    <svg className="ag-brand-mark" viewBox="0 0 42 42" aria-hidden="true">
      <path d="M5 7.5C5 5.6 6.6 4 8.5 4h10v14.5H5v-11Z" />
      <path d="M23.5 4h10C35.4 4 37 5.6 37 7.5v11H23.5V4Z" />
      <path d="M5 23.5h13.5V38h-10A3.5 3.5 0 0 1 5 34.5v-11Z" />
      <path d="M23.5 23.5H37v11a3.5 3.5 0 0 1-3.5 3.5h-10V23.5Z" />
      <circle cx="21" cy="21" r="6.2" />
    </svg>
  );
}

const ArrowIcon = () => (
  <Icon>
    <path d="M5 12h13.5M13.5 6.5 19 12l-5.5 5.5" />
  </Icon>
);

const PinIcon = () => (
  <Icon>
    <path d="M20 10.2c0 5.3-8 11.3-8 11.3S4 15.5 4 10.2a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.25" />
  </Icon>
);

const PeopleIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.7 19c.35-4 2.15-6 5.3-6s4.95 2 5.3 6" />
    <circle cx="17.2" cy="9" r="2.2" />
    <path d="M15 14.2c3.25-.6 5.1 1 5.3 4.3" />
  </Icon>
);

const StoreIcon = () => (
  <Icon>
    <path d="M4 9.5v10h16v-10M3 9.5l2-5h14l2 5" />
    <path d="M3 9.5c0 1.7 2.8 2.2 4.5 0 1.6 2.2 4.8 2.2 6.4 0 1.7 2.2 4.5 1.7 4.5 0M9 19.5v-5h6v5" />
  </Icon>
);

const SearchIcon = () => (
  <Icon>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Icon>
);

const RouteIcon = () => (
  <Icon>
    <circle cx="6" cy="17.5" r="2.5" />
    <circle cx="18" cy="6.5" r="2.5" />
    <path d="M8.5 17.5h2.2a3 3 0 0 0 3-3v-5a3 3 0 0 1 3-3" />
  </Icon>
);

const MapIcon = () => (
  <Icon>
    <path d="m3.5 6 5.5-3 6 3 5.5-3v15L15 21l-6-3-5.5 3V6Z" />
    <path d="M9 3v15M15 6v15" />
  </Icon>
);

const modules = [
  {
    className: "ag-module-business",
    eyebrow: "Economia do bairro",
    title: "Compre de quem está por perto.",
    copy: "Descubra lojas, restaurantes e pequenos negócios com endereço e contexto local.",
    href: launchBusinessUrl,
    link: "Explorar empresas",
    icon: <StoreIcon />,
    number: "01",
  },
  {
    className: "ag-module-map",
    eyebrow: "Território no mapa",
    title: "Veja o que existe em cada rua.",
    copy: "Explore empresas e pontos úteis dentro do território pelo mapa.",
    href: launchMapUrl,
    link: "Abrir o mapa",
    icon: <MapIcon />,
    number: "02",
  },
  {
    className: "ag-module-nearby",
    eyebrow: "Mais perto de você",
    title: "Encontre o que está próximo agora.",
    copy: "Use sua localização para descobrir empresas disponíveis ao seu redor.",
    href: launchNearbyUrl,
    link: "Ver perto de mim",
    icon: <RouteIcon />,
    number: "03",
  },
  {
    className: "ag-module-search",
    eyebrow: "Busca territorial",
    title: "Procure sem sair do contexto local.",
    copy: "Busque empresas e lugares dentro do território atual.",
    href: launchSearchUrl,
    link: "Buscar no território",
    icon: <SearchIcon />,
    number: "04",
  },
] as const;

export default function TerritoryEntryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let disposed = false;
    let authRevision = 0;
    let unsubscribe = () => undefined;

    void import("@/core/session/services/SessionService").then(
      ({ SessionService }) => {
        if (disposed) return;

        unsubscribe = SessionService.onAuthStateChange((_event, session) => {
          authRevision += 1;
          if (!disposed) setIsAuthenticated(Boolean(session?.user));
        });

        const readRevision = authRevision;
        void SessionService.getCurrentUser().then((user) => {
          if (!disposed && authRevision === readRevision) {
            setIsAuthenticated(Boolean(user));
          }
        });
      },
      () => undefined,
    );

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const accountHref = isAuthenticated ? buildLoginPath(ACCOUNT_PATHS.home) : AUTH_PATHS.login;
  const accountLabel = isAuthenticated ? "Minha conta" : "Entrar";

  return (
    <div className="ag-home">
      <a href="#conteudo" className="ag-skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="ag-header">
        <div className="ag-container ag-header-inner">
          <Link to="/" className="ag-brand" aria-label="Achegue-se — início">
            <BrandMark />
            <span>achegue-se</span>
          </Link>

          <nav className="ag-nav" aria-label="Navegação principal">
            <a href="#descobrir">Por perto</a>
            <Link to="/como-funciona">Como funciona</Link>
            <Link to={launchBusinessUrl}>Para negócios</Link>
          </nav>

          <div className="ag-header-actions">
            <Link
              className="ag-location-pill"
              to={launchMapUrl}
              aria-label={`Abrir mapa de ${LAUNCH_COMMUNITY_NAME}`}
            >
              <PinIcon />
              <span>Território: {LAUNCH_COMMUNITY_NAME}</span>
            </Link>
            <Link className="ag-account-link" to={accountHref}>
              {accountLabel}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        <section className="ag-hero" aria-labelledby="ag-hero-title">
          <div className="ag-container ag-hero-grid">
            <div className="ag-hero-copy">
              <p className="ag-kicker">
                <span /> A praça digital do seu bairro
              </p>
              <h1 id="ag-hero-title">
                Tudo que importa,
                <br />
                <em>logo ali.</em>
              </h1>
              <p className="ag-hero-lead">
                Empresas, mapa, busca e o que está perto de você {launchCommunityGenitiveLabel},
                em um só lugar.
              </p>

              <div className="ag-discovery-action">
                <Link className="ag-explore-cta" to={LAUNCH_URLS.portal}>
                  Explorar o {LAUNCH_COMMUNITY_DISCOVERY_LABEL}
                  <ArrowIcon />
                </Link>
                <p>Conheça primeiro. Nenhum cadastro é necessário para explorar.</p>
              </div>
            </div>

            <div className="ag-hero-visual">
              <div className="ag-photo-frame">
                <img
                  src="/images/home/achegue-se-community-hero-v1.webp"
                  alt="Moradores conversando em uma praça de bairro em Salvador"
                  width="1536"
                  height="1024"
                />
                <div className="ag-photo-shade" aria-hidden="true" />
                <p className="ag-photo-caption">
                  <span>Começamos por aqui</span>
                  {LAUNCH_PLACE_LABEL}
                </p>
              </div>

              <Link className="ag-hero-map-card" to={launchMapUrl}>
                <span className="ag-map-icon"><MapIcon /></span>
                <span>
                  <small>Seu território, ao vivo</small>
                  <strong>Explorar pelo mapa</strong>
                </span>
                <ArrowIcon />
              </Link>

              <div className="ag-live-card" aria-label="Comunidade local ativa">
                <span className="ag-avatar-stack" aria-hidden="true">
                  <i>A</i><i>J</i><i>M</i>
                </span>
                <span>
                  <strong>Feito por gente daqui</strong>
                  <small>informação local, sem ruído</small>
                </span>
              </div>
            </div>
          </div>

          <div className="ag-container ag-neighborhood-rail">
            <p>Agora em {LAUNCH_COMMUNITY_DISCOVERY_LABEL}</p>
            <div>
              {launchCommunityMembers.map((member, index) => (
                <Link to={launchMapUrl} key={member.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {getPublicTerritoryLocationLabel(member)}
                </Link>
              ))}
            </div>
            <Link className="ag-nearby-link" to={launchNearbyUrl}>
              Perto de mim <ArrowIcon />
            </Link>
          </div>
        </section>

        <section className="ag-discover" id="descobrir" aria-labelledby="ag-discover-title">
          <div className="ag-container">
            <div className="ag-section-heading">
              <p className="ag-section-index">01 — DESCUBRA</p>
              <div>
                <h2 id="ag-discover-title">A cidade fica menor quando tudo se conecta.</h2>
                <p>Escolha um caminho. O Achegue-se organiza o que acontece perto de você.</p>
              </div>
            </div>

            <div className="ag-module-grid">
              {modules.map((module) => (
                <article className={`ag-module-card ${module.className}`} key={module.title}>
                  <div className="ag-module-topline">
                    <span className="ag-module-icon">{module.icon}</span>
                    <span className="ag-module-number">{module.number}</span>
                  </div>
                  <p>{module.eyebrow}</p>
                  <h3>{module.title}</h3>
                  <div className="ag-module-footer">
                    <span>{module.copy}</span>
                    <Link to={module.href} aria-label={`${module.link}: ${module.title}`}>
                      {module.link} <ArrowIcon />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ag-how" id="como-funciona" aria-labelledby="ag-how-title">
          <div className="ag-container ag-how-grid">
            <div className="ag-how-intro">
              <p className="ag-section-index">02 — COMO FUNCIONA</p>
              <h2 id="ag-how-title">Seu bairro primeiro. O resto vem depois.</h2>
              <p>
                Aqui, o território não é um filtro escondido. É o ponto de partida para encontrar
                informação útil, pessoas próximas e negócios que fazem parte da rotina.
              </p>
              <Link to={launchBusinessUrl} className="ag-text-link">
                Começar a explorar <ArrowIcon />
              </Link>
            </div>

            <ol className="ag-steps">
              <li>
                <span>1</span>
                <div>
                  <h3>Entre pelo seu território</h3>
                  <p>Comece pelo Complexo ou use o mapa para navegar pela região.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <h3>Descubra o que está acontecendo</h3>
                  <p>Busque empresas, lugares e o que está perto de você em poucos toques.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <h3>Fortaleça quem está perto</h3>
                  <p>Participe da comunidade e faça a economia local circular.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="ag-manifesto" aria-labelledby="ag-manifesto-title">
          <div className="ag-container ag-manifesto-card">
            <p className="ag-manifesto-label">UM BAIRRO NÃO É SÓ UM ENDEREÇO</p>
            <h2 id="ag-manifesto-title">
              É conversa na calçada, trabalho circulando e gente que sabe onde encontrar.
            </h2>
            <div className="ag-manifesto-footer">
              <p>
                O Achegue-se começa em {LAUNCH_COMMUNITY_NAME} para tornar visível a
                potência que já existe em cada rua.
              </p>
              <Link to={LAUNCH_URLS.portal}>
                Explorar o território <ArrowIcon />
              </Link>
            </div>
            <BrandMark />
          </div>
        </section>
      </main>

      <footer className="ag-footer">
        <div className="ag-container ag-footer-grid">
          <div>
            <Link to="/" className="ag-brand ag-brand-footer" aria-label="Achegue-se — início">
              <BrandMark />
              <span>achegue-se</span>
            </Link>
            <p>A cidade acontece quando a gente se encontra.</p>
          </div>
          <nav aria-label="Links do rodapé">
            <Link to="/sobre">Sobre</Link>
            <Link to="/como-funciona">Como funciona</Link>
            <Link to={PRIVACY_POLICY_PATH}>Privacidade</Link>
            <Link to={ACCOUNT_PATHS.accessibility}>Acessibilidade</Link>
          </nav>
          <p className="ag-footer-place">
            Disponível inicialmente no<br />
            <strong>{LAUNCH_COMMUNITY_NAME}</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
