import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
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

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
const MINIMUM_FILL_MS = 1_200;

const BAIRROS = [
  "Pituba",
  "Barra",
  "Rio Vermelho",
  "Ondina",
  "Nordeste de Amaralina",
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

function TerritoryMapArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fbfa_0%,#eaf3ef_42%,#ffffff_100%)]" />
      <svg
        viewBox="0 0 390 620"
        className="absolute -right-28 top-16 h-[74svh] min-h-[520px] w-[92vw] max-w-[560px] opacity-[0.55] sm:-right-8 sm:w-[78vw] sm:opacity-75 lg:right-auto lg:left-[42%] lg:top-1/2 lg:h-[92vh] lg:max-h-[780px] lg:w-[44vw] lg:-translate-y-1/2 lg:opacity-90"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M279 0 C251 74 252 118 280 172 C311 231 288 281 305 338 C322 395 381 445 370 524 C362 583 324 611 280 620 L390 620 L390 0 Z"
          fill="#dcecf4"
        />
        <path
          d="M168 30 C220 54 246 100 238 151 C230 198 259 225 247 267 C234 311 266 347 243 390 C216 441 229 488 188 535 C156 572 106 568 78 526 C45 477 62 431 42 388 C16 332 44 296 35 239 C25 174 69 139 78 88 C86 45 121 14 168 30 Z"
          fill="rgba(24,179,126,0.08)"
          stroke="rgba(15,23,42,0.15)"
          strokeWidth="2"
        />
        <g stroke="rgba(15,23,42,0.08)" strokeWidth="1.25" fill="none">
          <path d="M86 94 C125 123 154 134 228 134" />
          <path d="M50 229 C118 219 174 229 249 264" />
          <path d="M61 353 C114 334 169 342 247 381" />
          <path d="M92 520 C128 475 172 453 224 452" />
          <path d="M156 35 C143 113 150 194 133 276 C117 357 139 452 126 552" />
          <path d="M209 76 C186 148 197 225 184 292 C172 359 199 425 182 513" />
        </g>
        <g>
          <circle cx="186" cy="205" r="20" fill="rgba(24,179,126,0.14)" />
          <circle cx="186" cy="205" r="7" fill="#18B37E" />
          <circle cx="118" cy="338" r="16" fill="rgba(249,115,22,0.13)" />
          <circle cx="118" cy="338" r="6" fill="#f97316" />
          <circle cx="213" cy="432" r="16" fill="rgba(14,165,233,0.12)" />
          <circle cx="213" cy="432" r="6" fill="#0ea5e9" />
        </g>
      </svg>
      <div className="absolute inset-y-0 left-0 w-[76vw] bg-gradient-to-r from-white/92 via-white/70 to-white/0 lg:w-[46vw]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/95 to-white/0" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-white via-white/82 to-white/0" />
    </div>
  );
}

function ProductAreaGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {PRODUCT_AREAS.map((area) => {
        const Icon = area.icon;
        return (
          <article
            key={area.title}
            className="min-h-[118px] rounded-[20px] border border-white/80 bg-white/92 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur"
          >
            <AreaIcon tone={area.tone}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </AreaIcon>
            <h2 className="mt-3 text-sm font-bold leading-tight text-slate-950">
              {area.title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {area.description}
            </p>
          </article>
        );
      })}
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
      const message = [
        `Bairro informado: ${form.bairro.trim()}`,
        `Tipo de contato: ${contact.contactMode === "email" ? "email" : "WhatsApp"}`,
        "Interesses: mobilidade local, gastronomia, feed do bairro, alertas, serviços e negócios locais.",
      ].join("\n");

      const result = await registerCommunityInterest({
        communityId: null,
        communitySlug: "salvador",
        territoryPath: `/ba/salvador/${form.bairro.trim().toLowerCase()}`,
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
          content="Achegue-se está em desenvolvimento: mobilidade, gastronomia, alertas, feed e serviços do seu bairro em Salvador."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="relative isolate min-h-[100svh] px-4 pb-8 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-6 lg:flex lg:items-center lg:px-10 lg:py-10">
        <TerritoryMapArt />

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
                  170 bairros
                </span>
              </div>

              <h1 className="max-w-[10ch] text-[2.86rem] font-semibold leading-[0.92] tracking-normal text-slate-950 min-[390px]:text-[3.1rem] sm:max-w-[11ch] sm:text-6xl lg:max-w-[12ch] lg:text-[5.8rem]">
                Seu bairro primeiro.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-700 sm:text-lg lg:text-xl lg:leading-8">
                Mobilidade, gastronomia, alertas e feed do bairro em Salvador.
              </p>
              <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base lg:max-w-lg">
                Inclui carona local e motoristas do bairro para lugares onde app de corrida nem sempre chega.
              </p>
            </div>

            <ProductAreaGrid className="hidden lg:grid lg:max-w-2xl" />
          </div>

          <aside className="relative z-10 rounded-[26px] border border-slate-200/70 bg-white/94 p-3.5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="mb-3.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f8c61] sm:text-[11px]">
                Entre na lista de espera
              </p>
              <h2 className="text-[1.45rem] font-semibold leading-tight text-slate-950 sm:text-2xl">
                Avise-me quando abrir.
              </h2>
              <p className="text-sm leading-5 text-slate-600">
                Sem atalhos. Tudo começa pelo cadastro.
              </p>
            </div>

            <form className="space-y-2.5 sm:space-y-3" onSubmit={handleSubmit} noValidate>
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
                <Label htmlFor="waitlist-name" className="text-sm font-semibold text-slate-800">
                  Nome
                </Label>
                <Input
                  id="waitlist-name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  autoComplete="name"
                  className="h-11 rounded-2xl border-slate-200 bg-white text-base shadow-sm focus-visible:ring-[#18B37E]/35 sm:h-12"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="waitlist-contact" className="text-sm font-semibold text-slate-800">
                  Email ou WhatsApp
                </Label>
                <Input
                  id="waitlist-contact"
                  value={form.contact}
                  onChange={(event) => update("contact", event.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  className="h-11 rounded-2xl border-slate-200 bg-white text-base shadow-sm focus-visible:ring-[#18B37E]/35 sm:h-12"
                  aria-describedby="waitlist-contact-help"
                  required
                />
                <p id="waitlist-contact-help" className="sr-only">
                  Use um e-mail ou um WhatsApp com DDD.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 min-[340px]:grid-cols-2 sm:gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="waitlist-bairro" className="text-sm font-semibold text-slate-800">
                    Bairro
                  </Label>
                  <select
                    id="waitlist-bairro"
                    value={form.bairro}
                    onChange={(event) => update("bairro", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-[#18B37E] focus:ring-2 focus:ring-[#18B37E]/35 sm:h-12"
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
                  <Label htmlFor="waitlist-role" className="text-sm font-semibold text-slate-800">
                    Perfil
                  </Label>
                  <select
                    id="waitlist-role"
                    value={form.role}
                    onChange={(event) =>
                      update("role", event.target.value as CommunityInterestRole)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-[#18B37E] focus:ring-2 focus:ring-[#18B37E]/35 sm:h-12"
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
                className="h-12 min-h-12 w-full rounded-2xl bg-[#18B37E] text-base font-bold text-white shadow-[0_16px_36px_rgba(24,179,126,0.28)] transition hover:bg-[#149f70] focus-visible:ring-[#18B37E]/40 disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none sm:h-[52px] sm:min-h-[52px]"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : null}
                Quero ser avisado
              </Button>
            </form>

            <div className="mt-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#18B37E] shadow-sm">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-slate-700">
                  A prioridade inicial é Salvador. Os cadastros ajudam a decidir quais bairros recebem mobilidade, feed, alertas e negócios locais primeiro.
                </p>
              </div>
            </div>
          </aside>

          <ProductAreaGrid className="lg:hidden" />
        </div>
      </section>
    </main>
  );
}
