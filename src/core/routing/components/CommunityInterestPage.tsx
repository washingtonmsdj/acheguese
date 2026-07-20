import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2, Loader2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useToast } from "@/shared/components/ui/use-toast";
import { useResolveTerritoryFromUrl } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
import { supabase } from "@/integrations/supabase/client";
import { TurnstileWidget } from "@/shared/components/security/TurnstileWidget";
import { TerritorialNotFound } from "./TerritorialNotFound";

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
const MIN_FILL_MS = 3_000; // Bots preenchem instantaneamente; humanos demoram alguns segundos.

function titleCaseFromSlug(value?: string): string {
  if (!value) return "Comunidade local";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const interestSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo")
    .max(120, "Máximo de 120 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido")
    .max(255, "E-mail muito longo"),
  phone: z
    .string()
    .trim()
    .max(30, "Telefone muito longo")
    .optional()
    .or(z.literal("")),
  role: z.enum(["morador", "comerciante", "prestador", "visitante", "outro"], {
    errorMap: () => ({ message: "Escolha uma opção" }),
  }),
  message: z
    .string()
    .trim()
    .max(1000, "Máximo de 1000 caracteres")
    .optional()
    .or(z.literal("")),
  wants_updates: z.boolean().default(true),
});

type InterestFormState = {
  full_name: string;
  email: string;
  phone: string;
  role: "morador" | "comerciante" | "prestador" | "visitante" | "outro";
  message: string;
  wants_updates: boolean;
};

const INITIAL_STATE: InterestFormState = {
  full_name: "",
  email: "",
  phone: "",
  role: "morador",
  message: "",
  wants_updates: true,
};

const ROLE_OPTIONS: { value: InterestFormState["role"]; label: string }[] = [
  { value: "morador", label: "Moro no bairro" },
  { value: "comerciante", label: "Tenho comércio na região" },
  { value: "prestador", label: "Sou prestador de serviços" },
  { value: "visitante", label: "Frequento a região" },
  { value: "outro", label: "Outro" },
];

export function CommunityInterestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, city } = useParams<{ state?: string; city?: string }>();
  const normalizedState = state?.trim() ?? "";
  const normalizedCity = city?.trim() ?? "";
  const { resolved } = useResolveTerritoryFromUrl();
  const { data: profile } = useCommunityProfile(resolved);

  const [form, setForm] = useState<InterestFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof InterestFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const mountedAtRef = useRef<number>(Date.now());
  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);
  const turnstileEnabled = TURNSTILE_SITE_KEY.length > 0;

  const communityBase = useMemo(() => {
    if (!normalizedState || !normalizedCity) return null;
    if (resolved?.kind === "group") {
      return `/${normalizedState}/${normalizedCity}/${resolved.group.slug}`;
    }
    if (resolved?.kind === "location" && resolved.location.type !== "city") {
      return `/${normalizedState}/${normalizedCity}/${resolved.location.slug}`;
    }
    return `/${normalizedState}/${normalizedCity}`;
  }, [normalizedCity, normalizedState, resolved]);

  const territoryName = useMemo(() => {
    if (resolved?.kind === "group") return resolved.group.name;
    if (resolved?.kind === "location") return resolved.location.name;
    return titleCaseFromSlug(normalizedCity);
  }, [normalizedCity, resolved]);

  const communitySlug = useMemo(() => {
    if (resolved?.kind === "group") return resolved.group.slug;
    if (resolved?.kind === "location") return resolved.location.slug;
    return null;
  }, [resolved]);

  const communityId = useMemo(() => profile?.id ?? null, [profile]);

  if (!communityBase) {
    return (
      <TerritorialNotFound message="A URL de interesse precisa informar estado e cidade válidos." />
    );
  }

  function updateField<K extends keyof InterestFormState>(key: K, value: InterestFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const parsed = interestSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof InterestFormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof InterestFormState | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const territoryPath = communityBase ?? null;
      const source = typeof window !== "undefined" ? window.location.pathname : "community-interest";
      const userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("community_interest_registrations")
        .insert({
          community_id: communityId,
          community_slug: communitySlug,
          territory_path: territoryPath,
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          role: parsed.data.role,
          message: parsed.data.message || null,
          wants_updates: parsed.data.wants_updates,
          source,
          user_agent: userAgent,
        });

      if (error) {
        const alreadyRegistered = error.code === "23505";
        if (alreadyRegistered) {
          setSubmitted(true);
          toast({
            title: "Você já está na lista",
            description: `Já registramos seu interesse em ${territoryName}. Vamos te avisar!`,
          });
          return;
        }
        throw error;
      }

      setSubmitted(true);
      toast({
        title: "Interesse registrado!",
        description: `Vamos avisar quando ${territoryName} estiver pronta.`,
      });
    } catch (submitError) {
      toast({
        title: "Não foi possível registrar",
        description:
          submitError instanceof Error
            ? submitError.message
            : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const heroTitle = profile?.hero_title ?? `Achegue-se ${territoryName} está chegando`;
  const heroDescription =
    profile?.description ??
    `Em breve, moradores, comércios, serviços e oportunidades de ${territoryName} em um só lugar. Deixe seu contato e seja avisado no lançamento.`;

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-12">
      <Helmet>
        <title>{`${heroTitle} | Achegue-se`}</title>
        <meta name="description" content={heroDescription} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => navigate(communityBase)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <MapPin className="h-3.5 w-3.5" />
          Voltar para {titleCaseFromSlug(normalizedCity)}
        </button>

        <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Próxima comunidade
          </div>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">{heroTitle}</h1>
          <p className="mt-3 text-muted-foreground">{heroDescription}</p>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-semibold">Tudo certo! 🎉</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Seu interesse em <strong>{territoryName}</strong> foi registrado. Assim que
                a comunidade for aberta, você recebe um e-mail para participar em primeira mão.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={() => navigate(communityBase)}>
                  Explorar {titleCaseFromSlug(normalizedCity)}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setForm(INITIAL_STATE);
                  }}
                >
                  Registrar outro interesse
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Nome completo *</Label>
                <Input
                  id="full_name"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(event) => updateField("full_name", event.target.value)}
                  aria-invalid={Boolean(errors.full_name)}
                  maxLength={120}
                  required
                />
                {errors.full_name ? (
                  <p className="text-xs text-destructive">{errors.full_name}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    maxLength={255}
                    required
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    maxLength={30}
                    placeholder="(71) 90000-0000"
                  />
                  {errors.phone ? (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Qual seu vínculo com {territoryName}?</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ROLE_OPTIONS.map((option) => {
                    const active = form.role === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("role", option.value)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        }`}
                        aria-pressed={active}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {errors.role ? (
                  <p className="text-xs text-destructive">{errors.role}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">
                  O que você gostaria de encontrar na comunidade? (opcional)
                </Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Ex.: divulgar meu comércio, encontrar eventos, receber alertas do bairro…"
                />
                <p className="text-right text-[11px] text-muted-foreground">
                  {form.message.length}/1000
                </p>
                {errors.message ? (
                  <p className="text-xs text-destructive">{errors.message}</p>
                ) : null}
              </div>

              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={form.wants_updates}
                  onCheckedChange={(checked) => updateField("wants_updates", Boolean(checked))}
                  className="mt-0.5"
                />
                <span>
                  Quero receber novidades sobre o lançamento e conteúdos da comunidade por
                  e-mail.
                </span>
              </label>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button type="submit" disabled={submitting} className="sm:min-w-40">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    profile?.primary_cta_label ?? "Cadastrar interesse"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(communityBase)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
