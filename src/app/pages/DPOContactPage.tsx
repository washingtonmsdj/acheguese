import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Mail,
  Send,
  Shield,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { PublicInfoPageShell } from "@/app/components/public/PublicInfoPageShell";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { DPO_REQUEST_ANTI_ABUSE_CONFIG } from "@/core/privacy/config/dpoAntiAbuse";
import { PrivacyService } from "@/core/privacy";
import { TurnstileWidget } from "@/shared/components/security/TurnstileWidget";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { getDpoEmail, getDpoName } from "@/shared/config/privacyContacts";
import { useToast } from "@/shared/hooks/use-toast";
import { buildMailtoUrl } from "@/shared/utils/contactLinks";
import { DPOContactSchema, type DPOContactInput } from "@/shared/validation/schemas/dpo.schema";

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
const TURNSTILE_REQUIRED =
  DPO_REQUEST_ANTI_ABUSE_CONFIG.turnstileRequiredInProduction && import.meta.env.PROD;

const REQUEST_TYPE_OPTIONS = [
  {
    value: "access",
    label: "Solicitação de acesso",
    description: "Obter cópia dos dados pessoais tratados pela plataforma.",
  },
  {
    value: "correction",
    label: "Correção de dados",
    description: "Ajustar dados incompletos, inexatos ou desatualizados.",
  },
  {
    value: "anonymization",
    label: "Anonimização ou bloqueio",
    description: "Solicitar restrição de uso ou tratamento inadequado.",
  },
  {
    value: "portability",
    label: "Portabilidade",
    description: "Receber dados em formato adequado para migração.",
  },
  {
    value: "deletion",
    label: "Eliminação",
    description: "Solicitar exclusão dos dados quando a base legal permitir.",
  },
  {
    value: "information",
    label: "Informações sobre compartilhamento",
    description: "Entender com quem os dados podem ter sido compartilhados.",
  },
  {
    value: "consent_revocation",
    label: "Revogação de consentimento",
    description: "Retirar um consentimento dado anteriormente.",
  },
  {
    value: "automated_decision",
    label: "Revisão de decisão automatizada",
    description: "Questionar uma decisão tomada com apoio automatizado.",
  },
  {
    value: "violation_report",
    label: "Denúncia de violação",
    description: "Reportar problema ou incidente envolvendo dados pessoais.",
  },
  {
    value: "other",
    label: "Outro assunto",
    description: "Usar quando o pedido não se encaixa nas categorias acima.",
  },
] as const;

const RIGHTS = [
  "Acesso aos seus dados",
  "Correção de dados",
  "Anonimização, bloqueio ou eliminação",
  "Portabilidade",
  "Informações sobre compartilhamento",
  "Revogação de consentimento",
] as const;

const RELATED_LINKS = [
  { label: "Privacidade da conta", to: "/conta/privacidade" },
  { label: "Política de privacidade", to: "/privacidade" },
  { label: "Termos de uso", to: "/termos" },
] as const;

const FIELD_CLASS =
  "border-territory-border bg-territory-canvas text-territory-ink placeholder:text-territory-muted focus-visible:ring-territory-brand";

export default function DPOContactPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const dpoEmail = getDpoEmail();
  const dpoName = getDpoName();
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileGeneration, setTurnstileGeneration] = useState(0);
  const turnstileEnabled = TURNSTILE_SITE_KEY.length > 0;
  const turnstileSatisfied = turnstileEnabled
    ? Boolean(turnstileToken)
    : !TURNSTILE_REQUIRED;

  const userMetadata = user?.user_metadata;
  const fullName =
    userMetadata && typeof userMetadata === "object"
      ? (userMetadata as { full_name?: unknown }).full_name
      : undefined;
  const defaultName = typeof fullName === "string" ? fullName : "";
  const defaultEmail = user?.email || "";

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DPOContactInput>({
    resolver: zodResolver(DPOContactSchema),
    mode: "onBlur",
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      subject: "",
      requestType: undefined,
      message: "",
    },
  });

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setTurnstileError(null);
    setTurnstileGeneration((current) => current + 1);
  };

  const contactMutation = useMutation({
    mutationFn: async (data: DPOContactInput) => {
      await PrivacyService.createDPORequest({
        requesterName: data.name,
        requesterEmail: data.email,
        subject: data.subject,
        requestType: data.requestType,
        message: data.message,
        honeypot,
        turnstileToken,
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description:
          "Recebemos sua solicitação. Ela será analisada conforme o direito exercido e os prazos aplicáveis da LGPD.",
      });

      reset({
        name: defaultName,
        email: defaultEmail,
        subject: "",
        requestType: undefined,
        message: "",
      });
      setHoneypot("");
      resetTurnstile();
    },
    onError: () => {
      if (turnstileToken) resetTurnstile();
      const fallbackMessage = dpoEmail
        ? `Tente novamente ou envie diretamente para ${dpoEmail}.`
        : "Tente novamente pelo formulário mais tarde.";

      toast({
        title: "Erro ao enviar",
        description: `Não foi possível registrar sua solicitação. ${fallbackMessage}`,
        variant: "destructive",
      });
    },
  });

  const onValid = (data: DPOContactInput) => {
    if (TURNSTILE_REQUIRED && !turnstileEnabled) {
      setTurnstileError(
        "Canal temporariamente indisponível: proteção anti-spam não configurada.",
      );
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setTurnstileError("Confirme a verificação anti-spam antes de enviar.");
      return;
    }
    setTurnstileError(null);
    contactMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Contato com o DPO</title>
      </Helmet>

      <PublicInfoPageShell
        eyebrow="Privacidade e LGPD"
        title="Contato com o encarregado de dados"
        description="Canal oficial para pedidos de titular, denúncias e temas de tratamento de dados."
        onBack={() => navigate(-1)}
        width="wide"
      >
        <section className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-territory-brand">
              Atendimento regulatório
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-territory-ink sm:text-[2rem]">
              Solicite acesso, correção, exclusão ou reporte uma violação
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-territory-muted">
              Use este formulário quando o assunto envolver direitos do titular, incidentes de dados,
              consentimentos, compartilhamento ou qualquer demanda formal ligada a privacidade.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-territory-border/60 bg-territory-canvas/60 p-4">
              <p className="text-sm font-semibold text-territory-ink">Prazo aplicável</p>
              <p className="mt-1 text-sm text-territory-muted">
                O prazo varia conforme o direito exercido; confirmação e acesso possuem regras próprias na LGPD.
              </p>
            </div>
            <div className="rounded-2xl border border-territory-border/60 bg-territory-canvas/60 p-4">
              <p className="text-sm font-semibold text-territory-ink">Canal formal</p>
              <p className="mt-1 text-sm text-territory-muted">Registro interno com rastreabilidade e status.</p>
            </div>
            <div className="rounded-2xl border border-territory-border/60 bg-territory-canvas/60 p-4">
              <p className="text-sm font-semibold text-territory-ink">Escopo</p>
              <p className="mt-1 text-sm text-territory-muted">Conta, consentimentos, exportação, exclusão e incidentes.</p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <Card className="rounded-3xl border-territory-border/70 bg-territory-surface/90 text-territory-ink shadow-sm">
            <CardHeader>
              <CardTitle className="text-territory-ink">Enviar solicitação</CardTitle>
              <CardDescription className="text-territory-muted">
                Preencha o formulário com contexto suficiente para análise do pedido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onValid)} className="space-y-6">
                <div
                  className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
                  aria-hidden="true"
                >
                  <Label htmlFor="dpo-website" className="text-territory-ink">Website</Label>
                  <Input
                    id="dpo-website"
                    name="website"
                    value={honeypot}
                    onChange={(event) => setHoneypot(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className={FIELD_CLASS}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-territory-ink">Nome completo</Label>
                    <Input id="name" {...register("name")} className={FIELD_CLASS} />
                    <InlineFieldError message={errors.name?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-territory-ink">E-mail</Label>
                    <Input id="email" type="email" {...register("email")} className={FIELD_CLASS} />
                    <InlineFieldError message={errors.email?.message} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestType" className="text-territory-ink">Tipo de solicitação</Label>
                  <Controller
                    name="requestType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="requestType" className={FIELD_CLASS}>
                          <SelectValue placeholder="Selecione o tipo de solicitação" />
                        </SelectTrigger>
                        <SelectContent className="border-territory-border bg-territory-surface text-territory-ink">
                          {REQUEST_TYPE_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="focus:bg-territory-raised focus:text-territory-ink"
                            >
                              <div className="flex flex-col items-start">
                                <span>{option.label}</span>
                                <span className="text-xs text-territory-muted">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <InlineFieldError message={errors.requestType?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-territory-ink">Assunto</Label>
                  <Input
                    id="subject"
                    {...register("subject")}
                    placeholder="Resumo curto do pedido"
                    className={FIELD_CLASS}
                  />
                  <InlineFieldError message={errors.subject?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-territory-ink">Mensagem detalhada</Label>
                  <Textarea
                    id="message"
                    rows={7}
                    placeholder="Explique o pedido, contexto, dados envolvidos e resultado esperado."
                    {...register("message")}
                    className={FIELD_CLASS}
                  />
                  <InlineFieldError message={errors.message?.message} />
                </div>

                <div className="rounded-2xl border border-territory-border/60 bg-territory-canvas/60 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-territory-muted" />
                    <p className="text-sm leading-6 text-territory-muted">
                      Pedidos de titular são analisados conforme o direito exercido. Para confirmação
                      de existência e acesso, a LGPD prevê resposta simplificada imediata ou declaração
                      completa em até 15 dias, conforme o caso.
                    </p>
                  </div>
                </div>

                {turnstileEnabled ? (
                  <div className="space-y-2">
                    <TurnstileWidget
                      key={turnstileGeneration}
                      siteKey={TURNSTILE_SITE_KEY}
                      action={DPO_REQUEST_ANTI_ABUSE_CONFIG.turnstileAction}
                      onVerify={(token) => {
                        setTurnstileToken(token);
                        setTurnstileError(null);
                      }}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => {
                        setTurnstileToken(null);
                        setTurnstileError("Não foi possível carregar a verificação anti-spam.");
                      }}
                    />
                    {turnstileError ? (
                      <p className="text-sm text-destructive" role="alert">
                        {turnstileError}
                      </p>
                    ) : null}
                  </div>
                ) : TURNSTILE_REQUIRED ? (
                  <p className="text-sm text-destructive" role="alert">
                    Canal temporariamente indisponível: proteção anti-spam não configurada.
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full justify-center bg-territory-sun text-territory-ink hover:bg-territory-sun/90 focus-visible:ring-territory-brand"
                  disabled={contactMutation.isPending || !turnstileSatisfied}
                >
                  {contactMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando solicitação
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar solicitação
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-3xl border-territory-border/70 bg-territory-surface/90 text-territory-ink shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-territory-ink">Informações do canal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-territory-muted" />
                  <div>
                    <p className="font-semibold text-territory-ink">Identidade do encarregado</p>
                    {dpoName ? (
                      <p className="text-territory-muted">{dpoName}</p>
                    ) : (
                      <p className="text-territory-muted">Identidade pública ainda não configurada.</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-territory-muted" />
                  <div>
                    <p className="font-semibold text-territory-ink">Email do DPO</p>
                    {dpoEmail ? (
                      <a
                        href={buildMailtoUrl(dpoEmail) ?? undefined}
                        className="text-territory-brand underline-offset-4 hover:underline"
                      >
                        {dpoEmail}
                      </a>
                    ) : (
                      <p className="text-territory-muted">E-mail público ainda não configurado.</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-territory-muted" />
                  <div>
                    <p className="font-semibold text-territory-ink">Prazo de resposta</p>
                    <p className="text-territory-muted">
                      Depende do direito exercido. Para confirmação ou acesso, a declaração completa pode
                      ser fornecida em até 15 dias.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-territory-muted" />
                  <div>
                    <p className="font-semibold text-territory-ink">Autoridade reguladora</p>
                    <a
                      href="https://www.gov.br/anpd/pt-br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-territory-brand underline-offset-4 hover:underline"
                    >
                      ANPD - Autoridade Nacional de Proteção de Dados
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-territory-border/70 bg-territory-surface/90 text-territory-ink shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-territory-ink">Direitos mais comuns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {RIGHTS.map((right) => (
                  <div key={right} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <p className="text-sm text-territory-ink">{right}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-territory-border/70 bg-territory-surface/90 text-territory-ink shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-territory-ink">Links relacionados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {RELATED_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between rounded-2xl border border-territory-border/60 bg-territory-canvas/60 px-3 py-3 text-sm text-territory-ink transition-colors hover:bg-territory-raised"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-territory-muted" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-warning/25 bg-warning/10 text-territory-ink shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-territory-ink">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Base legal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-territory-muted" />
                  <p className="text-sm leading-6 text-territory-muted">
                    Este canal apoia pedidos ligados aos arts. 18, 19 e 41 da LGPD, incluindo acesso,
                    correção, exclusão, compartilhamento, consentimento e contato com o encarregado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PublicInfoPageShell>
    </>
  );
}
