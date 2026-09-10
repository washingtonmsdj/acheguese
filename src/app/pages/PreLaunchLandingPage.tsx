import { Helmet } from "react-helmet-async";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bike,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  MoveUpRight,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { SALVADOR_COMMUNITY_LAUNCH_CLUSTER } from "@/core/community/config/communityLaunch";
import neighborhoodImage from "@/assets/hero-complexo-nordeste.jpg";
import commerceImage from "@/assets/complexo-comercio.jpg";
import PreLaunchWaitlist from "./PreLaunchWaitlist";
import "./PreLaunchLandingPage.css";

const PRODUCT_AREAS = [
  {
    number: "01",
    title: "A comunidade tem voz.",
    description:
      "Conversas, avisos e encontros. Um espaço para compartilhar o que importa para quem vive perto.",
    icon: MessageCircle,
    label: "Comunidade",
    className: "community",
  },
  {
    number: "02",
    title: "O melhor está por perto.",
    description:
      "Da loja da esquina à comida de quem você conhece. Mais visibilidade para os negócios do bairro.",
    icon: Store,
    label: "Comércio e gastronomia",
    className: "commerce",
  },
  {
    number: "03",
    title: "Seu corre encontra caminho.",
    description:
      "Mobilidade local, entregas e profissionais. Conexões que ajudam a resolver o dia a dia.",
    icon: Bike,
    label: "Mobilidade e serviços",
    className: "mobility",
  },
  {
    number: "04",
    title: "Talento vira oportunidade.",
    description:
      "Trabalho, classificados e educação. Um lugar para aproximar quem procura de quem tem a oferecer.",
    icon: BriefcaseBusiness,
    label: "Oportunidades",
    className: "opportunities",
  },
] as const;

const QUESTIONS = [
  {
    question: "O Achegue-se já está funcionando?",
    answer:
      "Estamos em pré-lançamento. A plataforma está sendo preparada para começar pelo Complexo do Nordeste de Amaralina, em Salvador. Entre na lista para receber novidades sobre a abertura. Os serviços serão liberados por etapas.",
  },
  {
    question: "Quem pode fazer parte?",
    answer:
      "Moradores, comerciantes, prestadores de serviços e quem frequenta a região. No cadastro, conte qual é o seu perfil e em qual bairro você está. A comunidade é feita por todos que participam da vida do lugar.",
  },
  {
    question: "Tenho um negócio. Como participo?",
    answer:
      "Entre na lista e escolha o perfil “Tenho negócio”. Assim, poderemos avisar sobre a abertura e os próximos passos para participar com o seu comércio.",
  },
  {
    question: "Vai chegar a outras cidades?",
    answer:
      "Essa é a proposta. Começamos em Salvador e queremos levar o Achegue-se a outras cidades e estados, respeitando a identidade de cada comunidade. Ainda não há datas de lançamento para novas regiões.",
  },
] as const;

function Brand() {
  return (
    <span className="prelaunch-brand">
      <span className="prelaunch-brand-icon" aria-hidden="true">
        <MoveUpRight />
      </span>
      achegue<span className="prelaunch-brand-ending">-se</span>
      <span className="prelaunch-brand-dot" aria-hidden="true">
        .
      </span>
    </span>
  );
}

export default function PreLaunchLandingPage() {
  return (
    <div className="prelaunch-home" id="topo">
      <Helmet>
        <title>Achegue-se | Sua comunidade. Novas possibilidades.</title>
        <meta
          name="description"
          content="Uma plataforma para conectar pessoas, negócios e oportunidades do bairro. O Achegue-se começa pelo Complexo do Nordeste de Amaralina, em Salvador. Entre na lista de espera."
        />
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700;800&display=swap"
        />
      </Helmet>
      <a className="prelaunch-skip" href="#main-content">
        Ir para o conteúdo
      </a>
      <div className="prelaunch-announcement">
        <span className="prelaunch-status-dot" /> O próximo capítulo do bairro
        está chegando.{" "}
        <a href="#participar">
          Faça parte desde o começo{" "}
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
      <header className="prelaunch-header prelaunch-container">
        <a href="#topo" aria-label="Achegue-se, início">
          <Brand />
        </a>
        <nav aria-label="Navegação principal">
          <a href="#possibilidades">O que nos conecta</a>
          <a href="#territorio">Onde começa</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <a
          className="prelaunch-button prelaunch-button-small"
          href="#participar"
        >
          Quero fazer parte <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </header>
      <main id="main-content">
        <section
          className="prelaunch-hero prelaunch-container"
          aria-labelledby="home-title"
        >
          <div className="prelaunch-hero-copy">
            <p className="prelaunch-eyebrow">
              <span /> DE DENTRO DO BAIRRO. PARA IR ALÉM.
            </p>
            <h1 id="home-title">
              A força é daqui.
              <br />O futuro é <span>de todos.</span>
            </h1>
            <p className="prelaunch-hero-description">
              Gente que se conhece. Negócios que movimentam a rua. Oportunidades
              que aproximam. Tudo isso tem um lugar:{" "}
              <strong>o Achegue-se.</strong>
            </p>
            <div className="prelaunch-hero-actions">
              <a className="prelaunch-button" href="#participar">
                Quero fazer parte <ArrowUpRight size={20} aria-hidden="true" />
              </a>
              <a className="prelaunch-text-link" href="#possibilidades">
                Conheça o projeto <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>
            <div className="prelaunch-origin">
              <MapPin size={19} aria-hidden="true" />
              <p>
                Nosso primeiro encontro é em{" "}
                <strong>
                  Complexo do Nordeste de Amaralina · Salvador, BA
                </strong>
              </p>
            </div>
          </div>
          <figure className="prelaunch-hero-visual">
            <img
              className="prelaunch-hero-image"
              src={neighborhoodImage}
              alt="Ilustração de uma comunidade litorânea, com casas coloridas e ruas próximas ao mar"
              width="1920"
              height="1080"
              fetchPriority="high"
            />
            <div className="prelaunch-photo-top">
              <span>
                <span className="prelaunch-status-dot" /> NOSSO PONTO DE PARTIDA
              </span>
              <ArrowUpRight aria-hidden="true" />
            </div>
            <div className="prelaunch-photo-title">
              <span>Salvador, Bahia</span>
              <p>
                É sobre pertencer.
                <br />E crescer junto.
              </p>
            </div>
            <figcaption>Imagem ilustrativa do acervo do projeto.</figcaption>
            <div className="prelaunch-photo-note">
              <Heart size={20} aria-hidden="true" />
              <span>
                Feito de gente.<strong>Movido por comunidade.</strong>
              </span>
            </div>
          </figure>
        </section>
        <div
          className="prelaunch-connections"
          aria-label="O que queremos aproximar"
        >
          <div className="prelaunch-container">
            <span>
              <Users /> Pessoas
            </span>
            <span>
              <Store /> Negócios locais
            </span>
            <span>
              <UtensilsCrossed /> Sabores
            </span>
            <span>
              <Bike /> Mobilidade
            </span>
            <span>
              <BriefcaseBusiness /> Oportunidades
            </span>
            <span>
              <GraduationCap /> Educação
            </span>
          </div>
        </div>
        <section
          id="possibilidades"
          className="prelaunch-possibilities prelaunch-container"
          aria-labelledby="possibilities-title"
        >
          <div className="prelaunch-section-heading">
            <div>
              <p className="prelaunch-eyebrow">
                UM BAIRRO. MUITAS POSSIBILIDADES.
              </p>
              <h2 id="possibilities-title">
                A vida acontece perto.
                <br />
                <span>A conexão também.</span>
              </h2>
            </div>
            <p>
              Estamos reunindo o que faz a comunidade acontecer em uma
              plataforma que cresce com ela.
            </p>
          </div>
          <div className="prelaunch-product-grid">
            {PRODUCT_AREAS.map(
              ({
                number,
                title,
                description,
                icon: Icon,
                label,
                className,
              }) => (
                <article
                  className={`prelaunch-product prelaunch-product-${className}`}
                  key={number}
                >
                  <div className="prelaunch-product-top">
                    <Icon size={27} strokeWidth={1.6} aria-hidden="true" />
                    <span>{number}</span>
                  </div>
                  <p className="prelaunch-product-label">{label}</p>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ),
            )}
          </div>
          <p className="prelaunch-release-note">
            <Bell size={15} aria-hidden="true" /> Estamos preparando cada
            conexão. Os recursos serão liberados por etapas.
          </p>
        </section>
        <section
          id="territorio"
          className="prelaunch-territory"
          aria-labelledby="territory-title"
        >
          <div className="prelaunch-container prelaunch-territory-layout">
            <div className="prelaunch-territory-copy">
              <p className="prelaunch-eyebrow">RAIZ LOCAL. HORIZONTE ABERTO.</p>
              <h2 id="territory-title">
                Começa no Complexo.
                <br />
                <span>Nasce para ir além.</span>
              </h2>
              <p>
                O Complexo do Nordeste de Amaralina é o nosso ponto de partida.
                Um território de encontros, de cultura e de gente que faz
                acontecer.
              </p>
              <p>
                É com essa comunidade que queremos construir o primeiro capítulo
                do Achegue-se. Depois, novas cidades e estados. Sempre com a
                identidade de cada lugar.
              </p>
              <a className="prelaunch-text-link" href="#participar">
                Faça parte desse começo{" "}
                <ArrowUpRight size={19} aria-hidden="true" />
              </a>
            </div>
            <div className="prelaunch-territory-card">
              <div className="prelaunch-territory-card-top">
                <span>
                  <MapPin size={18} aria-hidden="true" /> SALVADOR / BA
                </span>
                <span className="prelaunch-pilot">PRIMEIRO LANÇAMENTO</span>
              </div>
              <h3>
                Complexo do
                <br />
                Nordeste de Amaralina
              </h3>
              <p>Quatro bairros. Uma força coletiva.</p>
              <ul>
                {SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map(({ name, slug }) => (
                  <li key={slug}>
                    <span />
                    {name === "Chapada" ? "Chapada do Rio Vermelho" : name}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </li>
                ))}
              </ul>
              <div className="prelaunch-expansion">
                <span className="prelaunch-expansion-line" />
                <p>
                  Daqui para outras comunidades.
                  <br />
                  <strong>Uma expansão feita por etapas.</strong>
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          className="prelaunch-local prelaunch-container"
          aria-labelledby="local-title"
        >
          <figure>
            <img
              src={commerceImage}
              alt="Ilustração de um comerciante em uma banca de alimentos do bairro"
              width="1024"
              height="768"
              loading="lazy"
            />
            <figcaption>Imagem ilustrativa do acervo do projeto.</figcaption>
            <span className="prelaunch-local-stamp">
              QUEM É DAQUI
              <br />
              <strong>faz acontecer.</strong>
            </span>
          </figure>
          <div>
            <p className="prelaunch-eyebrow">QUEM EMPREENDE TAMBÉM PERTENCE.</p>
            <h2 id="local-title">
              Seu negócio faz
              <br />
              parte da história.
              <br />
              <span>E do próximo passo.</span>
            </h2>
            <p>
              Para quem abre a porta cedo, prepara o almoço, conserta, ensina ou
              faz entregas: o Achegue-se quer aproximar seu trabalho de quem
              está por perto.
            </p>
            <a className="prelaunch-button" href="#participar">
              Tenho um negócio ou serviço{" "}
              <ArrowUpRight size={19} aria-hidden="true" />
            </a>
          </div>
        </section>
        <section
          id="participar"
          className="prelaunch-join"
          aria-labelledby="join-title"
        >
          <div className="prelaunch-container prelaunch-join-layout">
            <div className="prelaunch-join-copy">
              <p className="prelaunch-eyebrow">
                <span /> PRÉ-LANÇAMENTO · LISTA DE ESPERA
              </p>
              <h2 id="join-title">
                O bairro é seu.
                <br />
                Esse começo <span>também.</span>
              </h2>
              <p>
                Se achegue. Deixe seu contato para acompanhar os próximos passos
                e saber quando a plataforma abrir.
              </p>
              <ul>
                <li>
                  <Check size={18} aria-hidden="true" /> Para quem mora,
                  trabalha ou circula por aqui
                </li>
                <li>
                  <Check size={18} aria-hidden="true" /> Novidades sobre o
                  lançamento
                </li>
                <li>
                  <Check size={18} aria-hidden="true" /> Seu interesse ajuda a
                  construir esse começo
                </li>
              </ul>
              <span className="prelaunch-join-signature">
                De pessoa em pessoa.
                <br />
                De bairro em bairro.
              </span>
            </div>
            <div className="prelaunch-form-card">
              <span className="prelaunch-form-step">VAMOS COMEÇAR?</span>
              <h3>Seu lugar está nessa história.</h3>
              <p>Cadastre seu interesse no lançamento em Salvador.</p>
              <PreLaunchWaitlist />
              <p className="prelaunch-privacy">
                Ao enviar, você solicita receber novidades do Achegue-se pelo
                contato informado. Seu contato não aparece publicamente na home.
              </p>
            </div>
          </div>
        </section>
        <section
          id="duvidas"
          className="prelaunch-faq prelaunch-container"
          aria-labelledby="faq-title"
        >
          <div>
            <p className="prelaunch-eyebrow">ANTES DE SE ACHEGAR</p>
            <h2 id="faq-title">
              Uma boa conversa
              <br />
              começa por aqui.
            </h2>
          </div>
          <div className="prelaunch-faq-list">
            {QUESTIONS.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="prelaunch-footer">
        <div className="prelaunch-container">
          <div>
            <a href="#topo" aria-label="Achegue-se, voltar ao início">
              <Brand />
            </a>
            <p>Conexões locais. Possibilidades sem fronteiras.</p>
          </div>
          <div>
            <span>De Salvador, com a força da comunidade.</span>
            <a href="#topo">
              Voltar ao topo <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="prelaunch-container prelaunch-footer-bottom">
          <span>© {new Date().getFullYear()} Achegue-se</span>
          <span>Em construção, junto com você.</span>
        </div>
      </footer>
    </div>
  );
}
