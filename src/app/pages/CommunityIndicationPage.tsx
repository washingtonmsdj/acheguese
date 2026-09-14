import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Megaphone,
  Users,
} from "lucide-react";
import { LAUNCH_URLS } from "@/core/routing/config/territory";

type IndicationView = "form" | "confirmation" | "notices" | "account";

const VIEW_VALUES: IndicationView[] = [
  "form",
  "confirmation",
  "notices",
  "account",
];

function getView(value: string | null): IndicationView {
  return VIEW_VALUES.includes(value as IndicationView)
    ? (value as IndicationView)
    : "form";
}

export default function CommunityIndicationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = getView(searchParams.get("view"));
  const [state, setState] = useState("Bahia");
  const [city, setCity] = useState("Feira de Santana");
  const [neighborhood, setNeighborhood] = useState("Centro");
  const [relationship, setRelationship] = useState("Moro aqui");
  const [noticeEmail, setNoticeEmail] = useState("");
  const [noticeOptIn, setNoticeOptIn] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  const regionLabel = useMemo(
    () => `${neighborhood}, ${city} · ${state === "Bahia" ? "BA" : state}`,
    [city, neighborhood, state],
  );

  const changeView = (nextView: IndicationView) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextView === "form") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", nextView);
    }
    setSearchParams(nextParams);
  };

  const handleBack = () => {
    if (view === "form") {
      navigate("/");
      return;
    }
    changeView(view === "confirmation" ? "form" : "confirmation");
  };

  const handleIndicationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    changeView("confirmation");
  };

  const handleAccountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate("/cadastro");
  };

  return (
    <div className="community-indication-page">
      <header className="community-indication-header">
        <button
          type="button"
          className="community-indication-back"
          aria-label="Voltar"
          onClick={handleBack}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <Link className="community-indication-wordmark" to="/">
          achegue-se<span aria-hidden="true">.</span>
        </Link>
        <div className="community-indication-header-spacer" aria-hidden="true" />
      </header>

      <main className={`community-indication-main is-${view}`}>
        <div className="community-indication-content">
          {view === "form" ? (
            <section className="community-indication-screen" aria-labelledby="indication-title">
              <div className="community-indication-heading-block">
                <h1 id="indication-title">
                  Onde você quer
                  <br />
                  o Achegue-se?
                </h1>
                <p className="community-indication-lead">
                  Sua indicação ajuda a planejar
                  <br />
                  os próximos lugares.
                </p>
              </div>

              <form className="community-indication-form" onSubmit={handleIndicationSubmit}>
                <label className="community-indication-field">
                  <span>Estado <b aria-hidden="true">*</b></span>
                  <select value={state} onChange={(event) => setState(event.target.value)} required>
                    <option>Bahia</option>
                    <option>Pernambuco</option>
                    <option>Sergipe</option>
                  </select>
                </label>

                <label className="community-indication-field">
                  <span>Cidade <b aria-hidden="true">*</b></span>
                  <select value={city} onChange={(event) => setCity(event.target.value)} required>
                    <option>Feira de Santana</option>
                    <option>Salvador</option>
                    <option>Vitória da Conquista</option>
                  </select>
                </label>

                <label className="community-indication-field">
                  <span>Bairro <b aria-hidden="true">*</b></span>
                  <select
                    value={neighborhood}
                    onChange={(event) => setNeighborhood(event.target.value)}
                    required
                  >
                    <option>Centro</option>
                    <option>Santa Cruz</option>
                    <option>Nordeste de Amaralina</option>
                  </select>
                </label>

                <label className="community-indication-field is-optional">
                  <span>Como você se relaciona com esse lugar? <em>(opcional)</em></span>
                  <select
                    value={relationship}
                    onChange={(event) => setRelationship(event.target.value)}
                  >
                    <option>Moro aqui</option>
                    <option>Tenho um negócio</option>
                    <option>Trabalho aqui</option>
                    <option>Conheço a região</option>
                  </select>
                  <small>Também pode indicar como negócio, profissional ou organização.</small>
                </label>

                <div className="community-indication-note is-starting">
                  <Megaphone aria-hidden="true" />
                  <span>
                    Hoje, começamos pelo Complexo
                    <strong>do Nordeste de Amaralina, em Salvador.</strong>
                  </span>
                </div>

                <button type="submit" className="community-indication-primary">
                  <span>Enviar indicação</span>
                  <ArrowRight aria-hidden="true" />
                </button>
                <p className="community-indication-caption">Sem criar conta para indicar.</p>
              </form>
            </section>
          ) : null}

          {view === "confirmation" ? (
            <section className="community-indication-screen is-confirmation" aria-labelledby="confirmation-title">
              <div className="community-indication-success-icon" aria-hidden="true">
                <span className="community-indication-success-rays">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <Check />
              </div>
              <h1 id="confirmation-title">
                Sua indicação
                <br />
                foi registrada
              </h1>
              <div className="community-indication-region">
                <strong>{neighborhood}</strong>
                <span>{city} · {state}</span>
              </div>
              <p className="community-indication-copy">
                Essa indicação ajuda no planejamento.
                <br />
                Ainda não há previsão de lançamento
                <br />
                para esse local.
              </p>
              <div className="community-indication-actions">
                <Link className="community-indication-primary" to={LAUNCH_URLS.community}>
                  <span>Explorar o Complexo</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className="community-indication-secondary"
                  onClick={() => changeView("notices")}
                >
                  Quero receber novidades
                </button>
                <button
                  type="button"
                  className="community-indication-text-action"
                  onClick={() => changeView("account")}
                >
                  Criar minha conta
                </button>
              </div>
              <div className="community-indication-bottom-note">
                <Users aria-hidden="true" />
                <span>Você pode explorar mesmo morando em outra região.</span>
              </div>
            </section>
          ) : null}

          {view === "notices" ? (
            <section className="community-indication-screen" aria-labelledby="notices-title">
              <div className="community-indication-heading-block">
                <h1 id="notices-title">
                  Quer acompanhar
                  <br />
                  as novidades?
                </h1>
                <p className="community-indication-lead">
                  Sobre {regionLabel}.
                </p>
              </div>

              <form
                className="community-indication-form community-indication-notices-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (noticeEmail && noticeOptIn) changeView("confirmation");
                }}
              >
                <label className="community-indication-field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={noticeEmail}
                    onChange={(event) => setNoticeEmail(event.target.value)}
                    placeholder="Seu e-mail"
                  />
                </label>

                <label className="community-indication-check-row">
                  <input
                    type="checkbox"
                    checked={noticeOptIn}
                    onChange={(event) => setNoticeOptIn(event.target.checked)}
                  />
                  <span>Quero receber avisos sobre a expansão nesta região.</span>
                </label>

                <Link className="community-indication-data-link" to="/sobre">
                  Como usamos seus dados
                </Link>

                <button
                  type="submit"
                  className="community-indication-primary"
                  disabled={!noticeEmail || !noticeOptIn}
                >
                  Receber novidades
                </button>
                <button
                  type="button"
                  className="community-indication-text-action"
                  onClick={() => changeView("confirmation")}
                >
                  Agora não
                </button>
                <p className="community-indication-cancel-note">
                  Você pode cancelar os avisos quando quiser.
                </p>
              </form>

              <div className="community-indication-note is-neutral">
                <Info aria-hidden="true" />
                <span>Receber avisos não cria uma conta.</span>
              </div>
            </section>
          ) : null}

          {view === "account" ? (
            <section className="community-indication-screen" aria-labelledby="account-title">
              <div className="community-indication-heading-block">
                <h1 id="account-title">
                  Você também pode
                  <br />
                  participar
                </h1>
                <p className="community-indication-lead">
                  Uma conta para conhecer o Achegue-se
                  <br />
                  e usar os recursos disponíveis.
                </p>
              </div>

              <div className="community-indication-note is-warning">
                <Users aria-hidden="true" />
                <span>
                  <strong>Sua região ainda não está ativa</strong>
                  Isso não impede você de criar uma conta e explorar o Complexo.
                </span>
              </div>

              <form className="community-indication-form community-indication-account-form" onSubmit={handleAccountSubmit}>
                <label className="community-indication-field">
                  <span>Nome</span>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    placeholder="Como você se chama?"
                  />
                </label>
                <label className="community-indication-field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                    placeholder="Seu e-mail"
                  />
                </label>
                <button type="submit" className="community-indication-primary">
                  <span>Continuar cadastro</span>
                  <ArrowRight aria-hidden="true" />
                </button>
              </form>

              <p className="community-indication-account-note">
                Você continuará para as próximas etapas da conta.
              </p>
              <div className="community-indication-account-separator" />
              <p className="community-indication-independent-note">
                Criar conta não ativa sua comunidade
                <br />
                nem inscreve você em avisos.
              </p>
              <p className="community-indication-login-note">
                Já tem conta? <Link to="/login">Entrar</Link>
              </p>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
