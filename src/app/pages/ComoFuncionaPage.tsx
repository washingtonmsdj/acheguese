import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { getStateByCode } from "@/core/location/data/brazilianStates";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { PRIVACY_POLICY_PATH } from "@/shared/constants/legal";
import "./ComoFuncionaPage.css";

const COMMUNITY_NAME = TERRITORY_CONFIG.launch.community.name;
const COMMUNITY_SHORT_NAME = COMMUNITY_NAME.replace(/^Complexo do /, "");
const CITY_NAME = TERRITORY_CONFIG.launch.name;
const STATE_NAME =
  getStateByCode(TERRITORY_CONFIG.launch.state)?.name ||
  TERRITORY_CONFIG.launch.state.toLocaleUpperCase("pt-BR");

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function BrandMark() {
  return (
    <svg className="ag-guide-brand-mark" viewBox="0 0 42 42" aria-hidden="true">
      <path d="M5 7.5C5 5.6 6.6 4 8.5 4h10v14.5H5v-11Z" />
      <path d="M23.5 4h10C35.4 4 37 5.6 37 7.5v11H23.5V4Z" />
      <path d="M5 23.5h13.5V38h-10A3.5 3.5 0 0 1 5 34.5v-11Z" />
      <path d="M23.5 23.5H37v11a3.5 3.5 0 0 1-3.5 3.5h-10V23.5Z" />
      <circle cx="21" cy="21" r="6.2" />
    </svg>
  );
}

const ArrowIcon = () => (
  <Icon><path d="M5 12h13.5M13.5 6.5 19 12l-5.5 5.5" /></Icon>
);

const MapIcon = () => (
  <Icon>
    <path d="m3.5 6 5.5-3 6 3 5.5-3v15L15 21l-6-3-5.5 3V6Z" />
    <path d="M9 3v15M15 6v15" />
  </Icon>
);

const SearchIcon = () => (
  <Icon><circle cx="10.5" cy="10.5" r="6.25" /><path d="m15.4 15.4 4.4 4.4" /></Icon>
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

const ShieldIcon = () => (
  <Icon>
    <path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z" />
    <path d="m8.5 12 2.2 2.2 4.8-5" />
  </Icon>
);

const steps = [
  {
    number: "01",
    title: "Comece pelo território",
    copy: `Conheça o ${COMMUNITY_NAME} e veja os bairros que fazem parte dessa rede local.`,
    icon: <MapIcon />,
  },
  {
    number: "02",
    title: "Descubra o que está perto",
    copy: "Encontre empresas, lugares e resultados próximos com endereço e contexto de verdade.",
    icon: <SearchIcon />,
  },
  {
    number: "03",
    title: "Participe quando quiser",
    copy: "Explore sem cadastro. Crie uma conta quando quiser salvar preferências, enviar mensagens ou gerenciar um negócio.",
    icon: <PeopleIcon />,
  },
] as const;

const possibilities = [
  {
    eyebrow: "Economia do bairro",
    title: "Empresas",
    copy: "Comércio, alimentação e iniciativas que movimentam a região.",
    href: LAUNCH_URLS.business,
    className: "ag-guide-card-business",
  },
  {
    eyebrow: "Território visual",
    title: "Mapa",
    copy: "Veja onde ficam empresas e pontos úteis dentro do território.",
    href: LAUNCH_URLS.map,
    className: "ag-guide-card-map",
  },
  {
    eyebrow: "Mais perto agora",
    title: "Perto de mim",
    copy: "Use sua localização para descobrir empresas próximas.",
    href: LAUNCH_URLS.nearby,
    className: "ag-guide-card-nearby",
  },
  {
    eyebrow: "Busca territorial",
    title: "Busca",
    copy: "Procure empresas e resultados sem perder o contexto do território.",
    href: LAUNCH_URLS.search,
    className: "ag-guide-card-search",
  },
] as const;

export default function ComoFuncionaPage() {
  return (
    <div className="ag-guide">
      <Helmet>
        <title>Como funciona | Achegue-se</title>
        <meta
          name="description"
          content={`Entenda como o Achegue-se conecta pessoas, lugares e oportunidades do ${COMMUNITY_NAME}.`}
        />
      </Helmet>

      <header className="ag-guide-header">
        <div className="ag-guide-container ag-guide-header-inner">
          <Link className="ag-guide-brand" to="/" aria-label="Achegue-se — início">
            <BrandMark /><span>achegue-se</span>
          </Link>

          <nav className="ag-guide-nav" aria-label="Navegação principal">
            <Link to="/">Por perto</Link>
            <a className="is-active" href="#passos" aria-current="page">Como funciona</a>
            <Link to={LAUNCH_URLS.business}>Para negócios</Link>
          </nav>

          <Link className="ag-guide-account" to={AUTH_PATHS.login}>Entrar <ArrowIcon /></Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="ag-guide-hero" aria-labelledby="ag-guide-title">
          <div className="ag-guide-container ag-guide-hero-grid">
            <div className="ag-guide-hero-copy">
              <p className="ag-guide-kicker"><span /> Um guia para chegar</p>
              <h1 id="ag-guide-title">Primeiro você conhece.<br /><em>Depois, encontra.</em></h1>
              <p className="ag-guide-lead">
                O Achegue-se organiza a vida local a partir do território. Você entende onde
                chegou, explora o que já existe e participa no seu tempo.
              </p>

            </div>

            <div className="ag-guide-hero-visual">
              <figure className="ag-guide-photo">
                <img
                  src="/images/home/achegue-se-community-hero-v1.webp"
                  alt={`Moradores conversando no ${COMMUNITY_NAME}`}
                  width="1536"
                  height="1024"
                />
                <figcaption>
                  <span>Nosso ponto de partida</span>
                  <strong>{COMMUNITY_SHORT_NAME}</strong>
                  <small>{CITY_NAME} · {STATE_NAME}</small>
                </figcaption>
              </figure>

              <div className="ag-guide-route" aria-label="Jornada pelo Achegue-se">
                <span><i>1</i> Conheça</span><b aria-hidden="true" />
                <span><i>2</i> Encontre</span><b aria-hidden="true" />
                <span><i>3</i> Participe</span>
              </div>
            </div>
          </div>
        </section>

        <section className="ag-guide-steps" id="passos" aria-labelledby="ag-guide-steps-title">
          <div className="ag-guide-container">
            <div className="ag-guide-heading">
              <p>01 — COMO FUNCIONA</p>
              <div>
                <h2 id="ag-guide-steps-title">Três passos. Nenhuma complicação.</h2>
                <p>O território vem antes do cadastro, do algoritmo e da categoria.</p>
              </div>
            </div>

            <ol className="ag-guide-step-grid">
              {steps.map((step) => (
                <li key={step.number}>
                  <div className="ag-guide-step-top"><span>{step.icon}</span><small>{step.number}</small></div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ag-guide-possibilities" aria-labelledby="ag-guide-possibilities-title">
          <div className="ag-guide-container">
            <div className="ag-guide-heading">
              <p>02 — O QUE TEM POR AQUI</p>
              <div>
                <h2 id="ag-guide-possibilities-title">Uma porta de entrada para a vida do bairro.</h2>
                <p>Comece pelo que faz sentido hoje. O restante continua a poucos passos.</p>
              </div>
            </div>

            <div className="ag-guide-card-grid">
              {possibilities.map((item) => (
                <Link className={`ag-guide-card ${item.className}`} to={item.href} key={item.title}>
                  <small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.copy}</p>
                  <span>Explorar <ArrowIcon /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="ag-guide-choice" aria-labelledby="ag-guide-choice-title">
          <div className="ag-guide-container ag-guide-choice-grid">
            <div className="ag-guide-choice-copy">
              <p className="ag-guide-dark-index">03 — VOCÊ DECIDE</p>
              <h2 id="ag-guide-choice-title">Olhar primeiro. Participar depois.</h2>
              <p>Você não precisa criar uma conta para entender o território. O cadastro só entra quando você quiser fazer parte da conversa.</p>
            </div>

            <div className="ag-guide-choice-cards">
              <article>
                <span className="ag-guide-choice-icon"><MapIcon /></span><small>Sem conta</small>
                <h3>Explore livremente</h3><p>Conheça empresas, mapa, busca e o que está perto de você.</p>
                <Link to={LAUNCH_URLS.portal}>Começar a explorar <ArrowIcon /></Link>
              </article>
              <article className="is-warm">
                <span className="ag-guide-choice-icon"><PeopleIcon /></span><small>Com sua conta</small>
                <h3>Chegue junto</h3><p>Envie mensagens, salve preferências e gerencie seus perfis.</p>
                <Link to={AUTH_PATHS.signup}>Criar minha conta <ArrowIcon /></Link>
              </article>
            </div>

            <div className="ag-guide-trust">
              <ShieldIcon />
              <p><strong>Contexto e respeito.</strong> Informação local fica mais útil quando vem acompanhada de território, identidade e cuidado.</p>
            </div>
          </div>
        </section>

        <section className="ag-guide-final" aria-labelledby="ag-guide-final-title">
          <div className="ag-guide-container ag-guide-final-grid">
            <div>
              <p className="ag-guide-kicker"><span /> Agora você já sabe</p>
              <h2 id="ag-guide-final-title">O melhor jeito de entender é chegar.</h2>
            </div>
            <div className="ag-guide-final-actions">
              <Link className="ag-guide-secondary" to="/">Voltar para a página inicial</Link>
              <Link className="ag-guide-business-link" to={LAUNCH_URLS.business}><StoreIcon /> Tenho um negócio no território</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="ag-guide-footer">
        <div className="ag-guide-container ag-guide-footer-grid">
          <Link className="ag-guide-brand" to="/" aria-label="Achegue-se — início"><BrandMark /><span>achegue-se</span></Link>
          <nav aria-label="Links do rodapé">
            <Link to="/sobre">Sobre</Link><Link to="/contato">Ajuda</Link><Link to={PRIVACY_POLICY_PATH}>Privacidade</Link>
          </nav>
          <p>Começamos pelo<br /><strong>{COMMUNITY_NAME}</strong></p>
        </div>
      </footer>
    </div>
  );
}
