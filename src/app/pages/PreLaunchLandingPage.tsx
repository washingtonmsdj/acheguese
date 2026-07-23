import { lazy, Suspense, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  Bell,
  Bike,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageSquareText,
  Route,
  ShieldCheck,
  Store,
  UtensilsCrossed,
} from "lucide-react";

import {
  registerCommunityInterest,
  type CommunityInterestRole,
} from "@/core/routing/services";
import { TurnstileWidget } from "@/shared/components/security/TurnstileWidget";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";
import { slugifyTerritory } from "@/shared/utils/slugify";

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
const MINIMUM_FILL_MS = 1_200;
const PreLaunchTerritoryMap = lazy(() =>
  import("@/app/pages/PreLaunchTerritoryMap").then((module) => ({
    default: module.PreLaunchTerritoryMap,
  })),
);

const BAIRROS = [
  "Complexo Nordeste de Amaralina",
  "Nordeste de Amaralina",
  "Pituba",
  "Barra",
  "Rio Vermelho",
  "Ondina",
  "Pernambués",
  "Itapuã",
  "Brotas",
  "Liberdade",
  "Cajazeiras",
] as const;

const ROLE_OPTIONS: { value: CommunityInterestRole; label: string }[] = [
  { value: "morador", label: "Sou morador" },
  { value: "comerciante", label: "Tenho negócio" },
  { value: "prestador", label: "Presto serviços" },
  { value: "visitante", label: "Frequento a região" },
];

const PRODUCT_AREAS = [
  {
    title: "Mobilidade local",
    description: "Para lugares onde app de corrida nem sempre chega.",
    icon: Bike,
    tone: "green",
  },
  {
    title: "Gastronomia perto de casa",
    description: "Comida, delivery e achados do bairro.",
    icon: UtensilsCrossed,
    tone: "orange",
  },
  {
    title: "Feed do bairro",
    description: "Conversas, pedidos e novidades da comunidade.",
    icon: MessageSquareText,
    tone: "blue",
  },
  {
    title: "Alertas importantes",
    description: "Avisos úteis para quem mora e circula por perto.",
    icon: Bell,
    tone: "orange",
  },
  {
    title: "Serviços e negócios locais",
    description: "Profissionais, lojas e soluções da vizinhança.",
    icon: Store,
    tone: "green",
  },
  {
    title: "Cadastro com prioridade",
    description: "A lista ajuda a definir os primeiros bairros liberados.",
    icon: ShieldCheck,
    tone: "slate",
  },
] as const;

const LAUNCH_SIGNALS = [
  { label: "Piloto", value: "Salvador", icon: MapPin },
  { label: "Primeiro", value: "Complexo", icon: Route },
  { label: "Entrada", value: "Lista", icon: ShieldCheck },
] as const;

type FormState = {
  name: string;
  contact: string;
  bairro: string;
  role: CommunityInterestRole;
};

type SubmitState =
  | { status: "idle"; message: null }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const INITIAL_FORM: FormState = {
  name: "",
  contact: "",
  bairro: "",
  role: "morador",
};

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function buildRegistrationContact(contact: string): {
  email: string;
  phone: string | null;
  contactMode: "email" | "whatsapp";
} | null {
  const normalized = contact.trim();
  if (isEmail(normalized)) {
    return { email: normalized.toLowerCase(), phone: null, contactMode: "email" };
  }

  const digits = getPhoneDigits(normalized);
  if (digits.length >= 10 && digits.length <= 15) {
    return {
      email: `whatsapp+${digits}@waitlist.acheguese.local`,
      phone: normalized,
      contactMode: "whatsapp",
    };
  }

  return null;
}

function AreaIcon({
  tone,
  children,
}: {
  tone: (typeof PRODUCT_AREAS)[number]["tone"];
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        tone === "green" && "bg-[#18B37E]/12 text-[#0f8c61]",
        tone === "orange" && "bg-orange-100 text-orange-700",
        tone === "blue" && "bg-sky-100 text-sky-700",
        tone === "slate" && "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}

function ProductAreaGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-3", className)}>
      {PRODUCT_AREAS.map((area) => {
        const Icon = area.icon;
        return (
          <article
            key={area.title}
            className="grid min-h-[94px] grid-cols-[auto,1fr] items-start gap-3 rounded-[20px] border border-white/80 bg-white/92 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:block sm:min-h-[118px]"
          >
            <AreaIcon tone={area.tone}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </AreaIcon>
            <div>
              <h2 className="text-sm font-bold leading-tight text-slate-950 sm:mt-3">
                {area.title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {area.description}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function LaunchSignalStrip() {
  return (
    <div className="mt-3.5 grid grid-cols-3 gap-2">
      {LAUNCH_SIGNALS.map((signal) => {
        const Icon = signal.icon;
        return (
          <div
            key={signal.label}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2.5"
          >
            <Icon className="h-4 w-4 text-[#18B37E]" aria-hidden="true" />
            <p className="mt-2 text-[11px] font-semibold leading-tight text-slate-500">
              {signal.label}
            </p>
            <p className="mt-1 text-xs font-bold leading-tight text-slate-950">
              {signal.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PreLaunchMapFallback() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[100svh] min-h-[760px] overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#eef6f3_52%,#dfe9e5_100%)] lg:inset-0 lg:h-auto"
      aria-hidden="true"
    >
      <div className="absolute right-[-18%] top-24 h-[48vh] w-[72vw] rounded-[44%] border border-[#18B37E]/18 bg-[#18B37E]/8 blur-[1px] sm:right-[-8%] lg:right-[8%] lg:top-[18%] lg:h-[56vh] lg:w-[42vw]" />
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white via-white/95 to-white/54 sm:w-[84vw] sm:via-white/88 sm:to-white/8 lg:w-[58vw] lg:from-white/98 lg:via-white/88 lg:to-white/0" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/90 to-white/0 sm:h-36 sm:from-white/98" />
      <div className="absolute inset-x-0 bottom-0 h-[62vh] bg-gradient-to-t from-white via-white/88 to-white/0 sm:h-80 sm:via-white/76 lg:h-72 lg:via-white/86" />
    </div>
  );
}

export default function PreLaunchLandingPage() {
  const mountedAtRef = useRef(Date.now());
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: null,
  });

  const contact = useMemo(
    () => buildRegistrationContact(form.contact),
    [form.contact],
  );
  const turnstileEnabled = TURNSTILE_SITE_KEY.length > 0;
  const canSubmit =
    form.name.trim().length >= 2 &&
    form.bairro.trim().length >= 2 &&
    Boolean(contact) &&
    !submitting;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitState({ status: "idle", message: null });
    if (key === "contact") setTurnstileError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (Date.now() - mountedAtRef.current < MINIMUM_FILL_MS) {
      setSubmitState({
        status: "error",
        message: "Revise os dados antes de enviar.",
      });
      return;
    }

    if (honeypot.trim()) {
      setSubmitState({
        status: "success",
        message: "Cadastro recebido. Vamos avisar quando o Achegue-se abrir.",
      });
      return;
    }

    if (!canSubmit || !contact) {
      setSubmitState({
        status: "error",
        message: "Informe nome, contato válido e bairro.",
      });
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      setTurnstileError("Confirme a verificação anti-spam para enviar.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedBairro = form.bairro.trim();
      const territorySlug = slugifyTerritory(selectedBairro);
      const message = [
        `Bairro informado: ${selectedBairro}`,
        `Tipo de contato: ${contact.contactMode === "email" ? "email" : "WhatsApp"}`,
        "Interesses: mobilidade local, gastronomia, feed do bairro, alertas, serviços e negócios locais.",
      ].join("\n");

      const result = await registerCommunityInterest({
        communityId: null,
        communitySlug: "salvador",
        territoryPath: `/ba/salvador/${territorySlug}`,
        fullName: form.name.trim(),
        email: contact.email,
        phone: contact.phone,
        role: form.role,
        message,
        wantsUpdates: true,
        source: "prelaunch-home",
        honeypot,
        turnstileToken: turnstileEnabled ? turnstileToken : null,
      });

      if (result.status === "already_registered") {
        setSubmitState({
          status: "success",
          message: "Você já está na lista. Vamos avisar assim que liberar.",
        });
        return;
      }

      if (result.status === "turnstile_failed") {
        setTurnstileToken(null);
        setTurnstileError("Não foi possível validar a proteção anti-spam. Tente novamente.");
        return;
      }

      setForm(INITIAL_FORM);
      setSubmitState({
        status: "success",
        message: "Cadastro recebido. Vamos avisar quando o Achegue-se abrir.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar agora. Tente novamente em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-[100svh] overflow-x-hidden bg-white text-slate-950"
    >
      <Helmet>
        <title>Achegue-se | Lista de espera</title>
        <meta
          name="description"
          content="Achegue-se está em desenvolvimento em Salvador, com primeiro lançamento no Complexo do Nordeste de Amaralina: mobilidade, gastronomia, alertas, feed e serviços do bairro."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="relative isolate min-h-[100svh] px-4 pb-8 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-6 lg:flex lg:items-center lg:px-10 lg:py-10">
        <Suspense fallback={<PreLaunchMapFallback />}>
          <PreLaunchTerritoryMap />
        </Suspense>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.64fr)] lg:items-center lg:gap-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-sm font-black text-[#18B37E] shadow-[0_10px_24px_rgba(15,23,42,0.10)] ring-1 ring-white">
                <span aria-hidden="true">A</span>
                <img
                  src="/images/logo-icon.png"
                  alt=""
                  className="absolute h-6 w-6 object-contain"
                />
              </span>
              <span className="font-heading text-xl font-semibold leading-none text-slate-950">
                Achegue-<span className="text-[#18B37E]">se</span>
              </span>
            </div>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/92 px-3 text-xs font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
              <Clock3 className="h-3.5 w-3.5 text-[#18B37E]" aria-hidden="true" />
              Pré-lançamento
            </span>
          </div>

          <div className="space-y-5 lg:col-start-1 lg:row-start-2">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2" aria-label="Status do lançamento">
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/88 px-3 text-xs font-semibold text-[#0f8c61] ring-1 ring-[#18B37E]/18">
                  <MapPin className="h-3.5 w-3.5 fill-[#18B37E] text-[#18B37E]" aria-hidden="true" />
                  Salvador em desenvolvimento
                </span>
                <span className="inline-flex min-h-8 items-center rounded-full bg-white/88 px-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Complexo Nordeste primeiro
                </span>
              </div>

              <h1 className="max-w-[10ch] text-[2.86rem] font-semibold leading-[0.92] tracking-normal text-slate-950 min-[390px]:text-[3.1rem] sm:max-w-[11ch] sm:text-6xl lg:max-w-[12ch] lg:text-[5.8rem]">
                Seu bairro primeiro.
              </h1>
              <p className="max-w-[20rem] text-base leading-7 text-slate-700 min-[390px]:max-w-[22rem] sm:max-w-xl sm:text-lg lg:text-xl lg:leading-8">
                Mobilidade, gastronomia, alertas e feed do bairro em Salvador.
              </p>
              <p className="max-w-[19rem] text-sm leading-6 text-slate-600 min-[390px]:max-w-[21rem] sm:max-w-xl sm:text-base lg:max-w-lg">
                O primeiro lançamento será no Complexo do Nordeste de Amaralina, com carona local e motoristas para lugares onde app de corrida nem sempre chega.
              </p>
            </div>

            <ProductAreaGrid className="hidden lg:grid lg:max-w-2xl" />
          </div>

          <aside className="relative z-10 rounded-[26px] border border-slate-200/70 bg-white/94 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="mb-2.5 space-y-0.5 sm:mb-3.5 sm:space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f8c61] sm:text-[11px]">
                Entre na lista de espera
              </p>
              <h2 className="text-[1.34rem] font-semibold leading-tight text-slate-950 sm:text-2xl">
                Avise-me quando abrir.
              </h2>
              <p className="text-sm leading-5 text-slate-600">
                Sem atalhos. Tudo começa pelo cadastro.
              </p>
            </div>

            <form className="space-y-2 sm:space-y-3" onSubmit={handleSubmit} noValidate>
              <div className="hidden" aria-hidden="true">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="waitlist-name" className="text-[13px] font-semibold text-slate-800 sm:text-sm">
                  Nome
                </Label>
                <Input
                  id="waitlist-name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  autoComplete="name"
                  placeholder="Seu nome"
                  className="h-10 rounded-2xl border-slate-200 bg-white text-base shadow-sm focus-visible:ring-[#18B37E]/35 sm:h-12"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="waitlist-contact" className="text-[13px] font-semibold text-slate-800 sm:text-sm">
                  Email ou WhatsApp
                </Label>
                <Input
                  id="waitlist-contact"
                  value={form.contact}
                  onChange={(event) => update("contact", event.target.value)}
                  autoComplete="email"
                  inputMode="text"
                  placeholder="Email ou WhatsApp"
                  className="h-10 rounded-2xl border-slate-200 bg-white text-base shadow-sm focus-visible:ring-[#18B37E]/35 sm:h-12"
                  aria-describedby="waitlist-contact-help"
                  required
                />
                <p id="waitlist-contact-help" className="sr-only">
                  Use um e-mail ou um WhatsApp com DDD.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 min-[340px]:grid-cols-2 sm:gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="waitlist-bairro" className="text-[13px] font-semibold text-slate-800 sm:text-sm">
                    Bairro
                  </Label>
                  <select
                    id="waitlist-bairro"
                    value={form.bairro}
                    onChange={(event) => update("bairro", event.target.value)}
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-[#18B37E] focus:ring-2 focus:ring-[#18B37E]/35 sm:h-12"
                    required
                  >
                    <option value="">Selecione</option>
                    {BAIRROS.map((bairro) => (
                      <option key={bairro} value={bairro}>
                        {bairro}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="waitlist-role" className="text-[13px] font-semibold text-slate-800 sm:text-sm">
                    Perfil
                  </Label>
                  <select
                    id="waitlist-role"
                    value={form.role}
                    onChange={(event) =>
                      update("role", event.target.value as CommunityInterestRole)
                    }
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-[#18B37E] focus:ring-2 focus:ring-[#18B37E]/35 sm:h-12"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {turnstileEnabled ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <TurnstileWidget
                    siteKey={TURNSTILE_SITE_KEY}
                    action="community-interest"
                    theme="light"
                    className="min-h-[65px]"
                    onVerify={(token) => {
                      setTurnstileToken(token);
                      setTurnstileError(null);
                    }}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => {
                      setTurnstileToken(null);
                      setTurnstileError("Falha ao carregar a verificação anti-spam.");
                    }}
                  />
                </div>
              ) : null}

              {turnstileError ? (
                <p className="flex items-start gap-2 rounded-2xl bg-orange-50 px-3 py-2 text-sm leading-5 text-orange-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {turnstileError}
                </p>
              ) : null}

              {submitState.message ? (
                <p
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "flex items-start gap-2 rounded-2xl px-3 py-2 text-sm leading-5",
                    submitState.status === "success"
                      ? "bg-[#18B37E]/10 text-[#0f6f50]"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {submitState.status === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  {submitState.message}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-11 min-h-11 w-full rounded-2xl bg-[#18B37E] text-base font-bold text-white shadow-[0_16px_36px_rgba(24,179,126,0.28)] transition-[background-color,box-shadow] hover:bg-[#149f70] focus-visible:ring-[#18B37E]/40 disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none sm:h-[52px] sm:min-h-[52px]"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : null}
                Quero ser avisado
              </Button>
            </form>

            <LaunchSignalStrip />
          </aside>

          <ProductAreaGrid className="lg:hidden" />
        </div>
      </section>
    </main>
  );
}
