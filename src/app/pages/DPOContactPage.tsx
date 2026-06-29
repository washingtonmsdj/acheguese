import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  ArrowLeft,
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

import { useAuth } from "@/core/auth/hooks/useAuth";
import { PrivacyService } from "@/core/privacy";
import { useToast } from "@/shared/hooks/use-toast";
import { getDpoEmail } from "@/shared/config/privacyContacts";
import { DPOContactSchema, type DPOContactInput } from "@/shared/validation/schemas/dpo.schema";
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
import { buildMailtoUrl } from "@/shared/utils/contactLinks";

const REQUEST_TYPE_OPTIONS = [
  {
    value: "access",
    label: "Solicitacao de acesso",
    description: "Obter copia dos dados pessoais tratados pela plataforma.",
  },
  {
    value: "correction",
    label: "Correcao de dados",
    description: "Ajustar dados incompletos, inexatos ou desatualizados.",
  },
  {
    value: "anonymization",
    label: "Anonimizacao ou bloqueio",
    description: "Solicitar restricao de uso ou tratamento inadequado.",
  },
  {
    value: "portability",
    label: "Portabilidade",
    description: "Receber dados em formato adequado para migracao.",
  },
  {
    value: "deletion",
    label: "Eliminacao",
    description: "Solicitar exclusao dos dados quando a base legal permitir.",
  },
  {
    value: "information",
    label: "Informacoes sobre compartilhamento",
    description: "Entender com quem os dados podem ter sido compartilhados.",
  },
  {
    value: "consent_revocation",
    label: "Revogacao de consentimento",
    description: "Retirar um consentimento dado anteriormente.",
  },
  {
    value: "automated_decision",
    label: "Revisao de decisao automatizada",
    description: "Questionar uma decisao tomada com apoio automatizado.",
  },
  {
    value: "violation_report",
    label: "Denuncia de violacao",
    description: "Reportar problema ou incidente envolvendo dados pessoais.",
  },
  {
    value: "other",
    label: "Outro assunto",
    description: "Usar quando o pedido nao se encaixa nas categorias acima.",
  },
] as const;

const RIGHTS = [
  "Acesso aos seus dados",
  "Correcao de dados",
  "Anonimizacao, bloqueio ou eliminacao",
  "Portabilidade",
  "Informacoes sobre compartilhamento",
  "Revogacao de consentimento",
] as const;

const RELATED_LINKS = [
  { label: "Privacidade da conta", to: "/conta/privacidade" },
  { label: "Politica de privacidade", to: "/privacidade" },
  { label: "Termos de uso", to: "/termos" },
] as const;

export default function DPOContactPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const dpoEmail = getDpoEmail();

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

  const contactMutation = useMutation({
    mutationFn: async (data: DPOContactInput) => {
      await PrivacyService.createDPORequest({
        userId: user?.id,
        requesterName: data.name,
        requesterEmail: data.email,
        subject: data.subject,
        requestType: data.requestType,
        message: data.message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitacao enviada",
        description: "Recebemos sua mensagem. O time de privacidade respondera em ate 15 dias uteis.",
      });

      reset({
        name: defaultName,
        email: defaultEmail,
        subject: "",
        requestType: undefined,
        message: "",
      });
    },
    onError: () => {
      const fallbackMessage = dpoEmail
        ? `Tente novamente ou envie diretamente para ${dpoEmail}.`
        : "Tente novamente pelo formulario mais tarde.";

      toast({
        title: "Erro ao enviar",
        description: `Nao foi possivel registrar sua solicitacao. ${fallbackMessage}`,
        variant: "destructive",
      });
    },
  });

  const onValid = (data: DPOContactInput) => {
    contactMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Contato com o DPO</title>
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))]">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8"
        >
          <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-card/85 sm:px-5 sm:shadow-sm">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => navigate(-1)}
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Privacidade e LGPD
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Contato com o encarregado de dados
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Canal oficial para pedidos de titular, denuncias e temas de tratamento de dados.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Atendimento regulatorio
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Solicite acesso, correcao, exclusao ou reporte uma violacao
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Use este formulario quando o assunto envolver direitos do titular, incidentes de dados,
                consentimentos, compartilhamento ou qualquer demanda formal ligada a privacidade.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-semibold text-foreground">Prazo inicial</p>
                <p className="mt-1 text-sm text-muted-foreground">Ate 15 dias uteis para resposta conforme LGPD.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-semibold text-foreground">Canal formal</p>
                <p className="mt-1 text-sm text-muted-foreground">Registro interno com rastreabilidade e status.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-semibold text-foreground">Escopo</p>
                <p className="mt-1 text-sm text-muted-foreground">Conta, consentimentos, exportacao, exclusao e incidentes.</p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Enviar solicitacao</CardTitle>
                <CardDescription>
                  Preencha o formulario com contexto suficiente para analise do pedido.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onValid)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input id="name" {...register("name")} />
                      <InlineFieldError message={errors.name?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...register("email")} />
                      <InlineFieldError message={errors.email?.message} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestType">Tipo de solicitacao</Label>
                    <Controller
                      name="requestType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="requestType">
                            <SelectValue placeholder="Selecione o tipo de solicitacao" />
                          </SelectTrigger>
                          <SelectContent>
                            {REQUEST_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex flex-col items-start">
                                  <span>{option.label}</span>
                                  <span className="text-xs text-muted-foreground">{option.description}</span>
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
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      {...register("subject")}
                      placeholder="Resumo curto do pedido"
                    />
                    <InlineFieldError message={errors.subject?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem detalhada</Label>
                    <Textarea
                      id="message"
                      rows={7}
                      placeholder="Explique o pedido, contexto, dados envolvidos e resultado esperado."
                      {...register("message")}
                    />
                    <InlineFieldError message={errors.message?.message} />
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="text-sm leading-6 text-muted-foreground">
                        Pedidos de titular seguem o fluxo regulatorio da plataforma. Em casos complexos,
                        o prazo pode exigir complementacao ou tratamento adicional com aviso ao solicitante.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full justify-center" disabled={contactMutation.isPending}>
                    {contactMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando solicitacao
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar solicitacao
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Informacoes do canal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Email do DPO</p>
                      {dpoEmail ? (
                        <a
                          href={buildMailtoUrl(dpoEmail) ?? undefined}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {dpoEmail}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">Email publico ainda nao configurado.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Prazo de resposta</p>
                      <p className="text-muted-foreground">Ate 15 dias uteis, conforme LGPD.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Autoridade reguladora</p>
                      <a
                        href="https://www.gov.br/anpd/pt-br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        ANPD - Autoridade Nacional de Protecao de Dados
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Direitos mais comuns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {RIGHTS.map((right) => (
                    <div key={right} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <p className="text-sm text-foreground">{right}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Links relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {RELATED_LINKS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-sm transition-colors hover:bg-muted/80"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Base legal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm leading-6 text-muted-foreground">
                      Este canal apoia pedidos ligados aos arts. 18, 19 e 41 da LGPD, incluindo acesso,
                      correcao, exclusao, compartilhamento, consentimento e contato com o encarregado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
