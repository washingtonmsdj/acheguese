import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Info, Megaphone } from "lucide-react";
import {
  registerCommunityInterest,
  type CommunityInterestRole,
} from "@/core/routing/services";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG } from "@/shared/config/security.config";
import { TurnstileWidget } from "@/shared/components/security/TurnstileWidget";
import { slugifyTerritory } from "@/shared/utils/slugify";

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
const TURNSTILE_REQUIRED =
  COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG.turnstileRequiredInProduction && import.meta.env.PROD;

const RELATIONSHIP_OPTIONS: { value: CommunityInterestRole; label: string }[] = [
  { value: "morador", label: "Moro aqui" },
  { value: "comerciante", label: "Tenho um negócio" },
  { value: "prestador", label: "Trabalho ou presto serviços aqui" },
  { value: "visitante", label: "Conheço ou frequento a região" },
];

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; alreadyRegistered?: boolean }
  | { status: "error"; message: string };

export default function CommunityIndicationPage() {
  const navigate = useNavigate();
  const mountedAtRef = useRef(Date.now());
  const [state, setState] = useState("Bahia");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [relationship, setRelationship] = useState<CommunityInterestRole>("morador");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileGeneration, setTurnstileGeneration] = useState(0);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  const phoneDigits = contact.replace(/\D/g, "");
  const validContact = isEmail || (phoneDigits.length >= 10 && phoneDigits.length <= 15);
  const canSubmit =
    name.trim().length >= 2 &&
    city.trim().length >= 2 &&
    neighborhood.trim().length >= 2 &&
    validContact &&
    submitState.status !== "submitting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    if (
      Date.now() - mountedAtRef.current <
      COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG.minimumFillMs
    ) {
      setSubmitState({ status: "error", message: "Revise os dados antes de enviar." });
      return;
    }

    if (TURNSTILE_REQUIRED && !TURNSTILE_SITE_KEY) {
      setTurnstileError("A proteção anti-spam não está configurada para este ambiente.");
      return;
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setTurnstileError("Confirme a verificação anti-spam para enviar.");
      return;
    }

    setSubmitState({ status: "submitting" });
    try {
      const normalizedCity = slugifyTerritory(city.trim());
      const normalizedNeighborhood = slugifyTerritory(neighborhood.trim());
      const phone = isEmail ? null : contact.trim();
      const email = isEmail ? contact.trim().toLowerCase() : null;

      const result = await registerCommunityInterest({
        communityId: null,
        communitySlug: normalizedCity,
        territoryPath: `/ba/${normalizedCity}/${normalizedNeighborhood}`,
        fullName: name.trim(),
        email,
        phone,
        role: relationship,
        message: `Indicação de expansão. Estado: ${state.trim()}. Cidade: ${city.trim()}. Bairro: ${neighborhood.trim()}.`,
        wantsUpdates,
        source: "community-indication",
        honeypot,
        turnstileToken,
      });

      if (result.status === "turnstile_failed") {
        setTurnstileToken(null);
        setTurnstileGeneration((value) => value + 1);
        setTurnstileError("Não foi possível validar a proteção anti-spam. Tente novamente.");
        setSubmitState({ status: "idle" });
        return;
      }

      setSubmitState({
        status: "success",
        alreadyRegistered: result.status === "already_registered",
      });
    } catch (error) {
      setTurnstileToken(null);
      setTurnstileGeneration((value) => value + 1);
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Não foi possível enviar agora.",
      });
    }
  };

  if (submitState.status === "success") {
    return (
      <div className="community-indication-page">
        <header className="community-indication-header">
          <Link className="community-indication-wordmark" to="/">
            achegue-se<span aria-hidden="true">.</span>
          </Link>
        </header>
        <main className="community-indication-main is-confirmation">
          <section className="community-indication-screen is-confirmation" aria-labelledby="confirmation-title">
            <div className="community-indication-success-icon" aria-hidden="true">
              <Check />
            </div>
            <h1 id="confirmation-title">
              {submitState.alreadyRegistered ? "Sua indicação já está registrada" : "Sua indicação foi registrada"}
            </h1>
            <div className="community-indication-region">
              <strong>{neighborhood}</strong>
              <span>{city} · {state}</span>
            </div>
            <p className="community-indication-copy">
              Estamos começando pelo Complexo do Nordeste de Amaralina.
              <br />
              A expansão será por etapas, sem prazo artificial.
            </p>
            <div className="community-indication-actions">
              <Link className="community-indication-primary" to={LAUNCH_URLS.community}>
                <span>Explorar o Complexo</span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="community-indication-secondary" to="/cadastro">
                Criar minha conta
              </Link>
              <button type="button" className="community-indication-text-action" onClick={() => navigate("/")}>Voltar ao início</button>
            </div>
            <div className="community-indication-bottom-note">
              <Info aria-hidden="true" />
              <span>Indicar uma região não ativa uma comunidade e não cria uma conta.</span>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="community-indication-page">
      <header className="community-indication-header">
        <button type="button" className="community-indication-back" aria-label="Voltar" onClick={() => navigate("/")}>
          <ArrowLeft aria-hidden="true" />
        </button>
        <Link className="community-indication-wordmark" to="/">
          achegue-se<span aria-hidden="true">.</span>
        </Link>
        <div className="community-indication-header-spacer" aria-hidden="true" />
      </header>

      <main className="community-indication-main is-form">
        <section className="community-indication-screen" aria-labelledby="indication-title">
          <div className="community-indication-heading-block">
            <p className="entry-eyebrow">Expansão por etapas</p>
            <h1 id="indication-title">Quer o Achegue-se na sua comunidade?</h1>
            <p className="community-indication-lead">
              Conte de onde você é e ajude a indicar os próximos lugares.
            </p>
          </div>

          <form className="community-indication-form" onSubmit={handleSubmit} noValidate>
            <div className="hidden" aria-hidden="true">
              <label htmlFor="community-indication-company">Empresa</label>
              <input id="community-indication-company" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
            </div>

            <label className="community-indication-field">
              <span>Estado</span>
              <input value={state} onChange={(event) => setState(event.target.value)} required />
            </label>
            <label className="community-indication-field">
              <span>Cidade</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ex.: Salvador" required />
            </label>
            <label className="community-indication-field">
              <span>Bairro</span>
              <input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Ex.: Nordeste de Amaralina" required />
            </label>
            <label className="community-indication-field is-optional">
              <span>Como você se relaciona com esse lugar? <em>(opcional)</em></span>
              <select value={relationship} onChange={(event) => setRelationship(event.target.value as CommunityInterestRole)}>
                {RELATIONSHIP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <div className="community-indication-note is-starting">
              <Megaphone aria-hidden="true" />
              <span>
                Hoje, começamos pelo Complexo
                <strong>do Nordeste de Amaralina, em Salvador.</strong>
              </span>
            </div>

            <div className="community-indication-field">
              <span>Seu nome</span>
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Como você se chama?" required />
            </div>
            <div className="community-indication-field">
              <span>E-mail ou WhatsApp</span>
              <input value={contact} onChange={(event) => setContact(event.target.value)} autoComplete="email" placeholder="Para identificarmos sua indicação" required />
            </div>
            <label className="community-indication-check-row">
              <input type="checkbox" checked={wantsUpdates} onChange={(event) => setWantsUpdates(event.target.checked)} />
              <span>Quero receber novidades sobre a expansão nesta região. <em>(opcional)</em></span>
            </label>

            {TURNSTILE_SITE_KEY ? (
              <TurnstileWidget
                key={turnstileGeneration}
                siteKey={TURNSTILE_SITE_KEY}
                action={COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG.turnstileAction}
                theme="light"
                className="min-h-[65px]"
                onVerify={(token) => { setTurnstileToken(token); setTurnstileError(null); }}
                onExpire={() => setTurnstileToken(null)}
                onError={() => { setTurnstileToken(null); setTurnstileError("Falha ao carregar a verificação anti-spam."); }}
              />
            ) : null}

            {turnstileError ? <p role="alert" className="community-indication-error">{turnstileError}</p> : null}
            {submitState.status === "error" ? <p role="alert" className="community-indication-error">{submitState.message}</p> : null}

            <button type="submit" className="community-indication-primary" disabled={!canSubmit}>
              {submitState.status === "submitting" ? <span>Enviando…</span> : <span>Indicar minha comunidade</span>}
              <ArrowRight aria-hidden="true" />
            </button>
            <p className="community-indication-caption">Sem criar uma conta. Seus dados servem apenas para registrar a indicação.</p>
          </form>
        </section>
      </main>
    </div>
  );
}
