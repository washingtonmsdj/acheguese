import { useMemo, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  registerCommunityInterest,
  type CommunityInterestRole,
} from "@/core/routing/services";
import { SALVADOR_COMMUNITY_LAUNCH_CLUSTER } from "@/core/community/config/communityLaunch";
import { COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG } from "@/shared/config/security.config";
import { TurnstileWidget } from "@/shared/components/security/TurnstileWidget";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";
import { slugifyTerritory } from "@/shared/utils/slugify";
const TURNSTILE_SITE_KEY = (
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ""
).trim();
const TURNSTILE_REQUIRED =
  COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG.turnstileRequiredInProduction &&
  import.meta.env.PROD;

const BAIRROS = [
  "Complexo Nordeste de Amaralina",
  ...SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map((territory) => territory.name),
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
    return {
      email: normalized.toLowerCase(),
      phone: null,
      contactMode: "email",
    };
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

export default function PreLaunchWaitlist() {
  const mountedAtRef = useRef(Date.now());
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileGeneration, setTurnstileGeneration] = useState(0);
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
  const turnstileSatisfied = turnstileEnabled
    ? Boolean(turnstileToken)
    : !TURNSTILE_REQUIRED;
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

  function resetTurnstile() {
    setTurnstileToken(null);
    setTurnstileGeneration((current) => current + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (
      Date.now() - mountedAtRef.current <
      COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG.minimumFillMs
    ) {
      setSubmitState({
        status: "error",
        message: "Revise os dados antes de enviar.",
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

    if (TURNSTILE_REQUIRED && !turnstileEnabled) {
      setTurnstileError(
        "Cadastro temporariamente indisponível: proteção anti-spam não configurada.",
      );
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
        turnstileToken,
      });

      if (result.status === "already_registered") {
        setSubmitState({
          status: "success",
          message: "Você já está na lista. Vamos avisar assim que liberar.",
        });
        return;
      }

      if (result.status === "turnstile_failed") {
        resetTurnstile();
        setTurnstileError(
          "Não foi possível validar a proteção anti-spam. Tente novamente.",
        );
        return;
      }

      setForm(INITIAL_FORM);
      setSubmitState({
        status: "success",
        message: "Cadastro recebido. Vamos avisar quando o Achegue-se abrir.",
      });
    } catch (error) {
      if (turnstileToken) resetTurnstile();
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
    <form
      aria-label="Lista de espera"
      className="prelaunch-waitlist"
      onSubmit={handleSubmit}
      noValidate
    >
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
        <Label htmlFor="waitlist-name" className="prelaunch-label">
          Nome
        </Label>
        <Input
          id="waitlist-name"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          autoComplete="name"
          placeholder="Seu nome"
          className="prelaunch-field"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-contact" className="prelaunch-label">
          Email ou WhatsApp
        </Label>
        <Input
          id="waitlist-contact"
          value={form.contact}
          onChange={(event) => update("contact", event.target.value)}
          autoComplete="email"
          inputMode="text"
          placeholder="Email ou WhatsApp"
          className="prelaunch-field"
          aria-describedby="waitlist-contact-help"
          required
        />
        <p id="waitlist-contact-help" className="sr-only">
          Use um e-mail ou um WhatsApp com DDD.
        </p>
      </div>

      <div className="prelaunch-field-row">
        <div className="space-y-1.5">
          <Label htmlFor="waitlist-bairro" className="prelaunch-label">
            Bairro
          </Label>
          <select
            id="waitlist-bairro"
            value={form.bairro}
            onChange={(event) => update("bairro", event.target.value)}
            className="prelaunch-field"
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
          <Label htmlFor="waitlist-role" className="prelaunch-label">
            Perfil
          </Label>
          <select
            id="waitlist-role"
            value={form.role}
            onChange={(event) =>
              update("role", event.target.value as CommunityInterestRole)
            }
            className="prelaunch-field"
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
            key={turnstileGeneration}
            siteKey={TURNSTILE_SITE_KEY}
            action={COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG.turnstileAction}
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
      ) : TURNSTILE_REQUIRED ? (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2 text-sm leading-5 text-red-700">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          Cadastro temporariamente indisponível: proteção anti-spam não
          configurada.
        </p>
      ) : null}

      {turnstileError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl bg-orange-50 px-3 py-2 text-sm leading-5 text-orange-800"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
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
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          )}
          {submitState.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={!canSubmit || !turnstileSatisfied}
        className="prelaunch-submit"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : null}
        Quero ser avisado
      </Button>
    </form>
  );
}
