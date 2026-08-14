import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Cookie,
  Download,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import {
  PrivacySettingsService,
  type DeletionStatusRecord,
  type UserConsentRecord,
} from "@/core/privacy/services/PrivacySettingsService";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";

type UserConsent = UserConsentRecord;
type DeletionStatus = DeletionStatusRecord;

function getConsentIcon(type: string): React.ReactNode {
  switch (type) {
    case "cookies":
      return <Cookie className="h-5 w-5" />;
    case "analytics":
      return <FileText className="h-5 w-5" />;
    case "marketing":
      return <Mail className="h-5 w-5" />;
    case "geolocation":
      return <MapPin className="h-5 w-5" />;
    case "notifications":
      return <Bell className="h-5 w-5" />;
    case "data_processing":
      return <Shield className="h-5 w-5" />;
    case "third_party":
      return <FileText className="h-5 w-5" />;
    case "terms_of_service":
      return <FileText className="h-5 w-5" />;
    case "privacy_policy":
      return <Shield className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

function ConsentRow({
  type,
  label,
  consent,
  disabled,
  onChange,
}: {
  type: string;
  label: string;
  consent?: UserConsent;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const isGranted = consent?.granted ?? false;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="pt-0.5 text-muted-foreground">
          {getConsentIcon(type)}
        </div>
        <div>
          <Label
            htmlFor={`consent-${type}`}
            className="font-medium text-foreground"
          >
            {label}
          </Label>
          {consent?.granted_at ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {isGranted
                ? `Concedido em ${new Date(consent.granted_at).toLocaleDateString("pt-BR")}`
                : "Revogado"}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Ainda não configurado
            </p>
          )}
        </div>
      </div>
      <Switch
        id={`consent-${type}`}
        checked={isGranted}
        onCheckedChange={onChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: consents, isLoading: consentsLoading } = useQuery({
    queryKey: ["user-consents", user?.id],
    queryFn: async () => PrivacySettingsService.getUserConsents(user!.id),
    enabled: !!user?.id,
  });

  const { data: deletionStatus } = useQuery({
    queryKey: ["deletion-status", user?.id],
    queryFn: async () => PrivacySettingsService.getDeletionStatus(user!.id),
    enabled: !!user?.id,
  });

  const updateConsentMutation = useMutation({
    mutationFn: async ({
      consentType,
      granted,
    }: {
      consentType: string;
      granted: boolean;
    }) => {
      await PrivacySettingsService.recordConsent({
        userId: user!.id,
        consentType,
        granted,
        userAgent: navigator.userAgent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-consents", user?.id] });
      toast({
        title: "Preferencia atualizada",
        description: "Sua preferência de privacidade foi salva.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a preferência.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <Navigate to={appUrls.auth.login} replace />;
  }

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const accessToken = await PrivacySettingsService.getAccessToken();
      const blob = await PrivacySettingsService.exportUserData(accessToken);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${user.id.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Dados exportados",
        description: "Seus dados foram exportados com sucesso.",
      });
    } catch {
      toast({
        title: "Erro na exportacao",
        description: "Não foi possível exportar seus dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const accessToken = await PrivacySettingsService.getAccessToken();
      const result = await PrivacySettingsService.requestAccountDeletion({
        accessToken,
        reason: deleteReason,
      });

      queryClient.invalidateQueries({ queryKey: ["deletion-status", user.id] });
      toast({
        title: "Conta agendada para exclusao",
        description: `Sua conta será excluída em ${result.days_until_purge} dias.`,
      });
      setShowDeleteConfirm(false);
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description:
          (error instanceof Error ? error.message : null) ||
          "Não foi possível solicitar a exclusão da conta.",
        variant: "destructive",
      });
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await PrivacySettingsService.cancelAccountDeletion();
      queryClient.invalidateQueries({ queryKey: ["deletion-status", user.id] });
      toast({
        title: "Exclusao cancelada",
        description: "Sua conta não será mais excluída.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a exclusão.",
        variant: "destructive",
      });
    }
  };

  const consentLabels: Record<string, string> = {
    cookies: "Cookies não essenciais",
    analytics: "Analytics e métricas",
    marketing: "Marketing e promoções",
    geolocation: "Geolocalização precisa",
    notifications: "Notificações push",
    data_processing: "Processamento de dados",
    third_party: "Compartilhamento com terceiros",
    terms_of_service: "Termos de uso",
    privacy_policy: "Política de privacidade",
  };

  return (
    <>
      <Helmet>
        <title>Privacidade e dados</title>
      </Helmet>

      <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1080px] px-3 pb-24 pt-4 focus:outline-none sm:px-6 sm:pb-10 sm:pt-6 lg:px-8"
        >
          <div className="sticky top-0 z-20 -mx-3 mb-5 border-b border-territory-border bg-territory-canvas/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => navigate(appUrls.settings)}
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  LGPD e conta
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Privacidade e dados
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Consentimentos, exportação e exclusão da conta.
                </p>
              </div>
            </div>
          </div>

          {deletionStatus?.status === "scheduled" ? (
            <Card className="mb-5 rounded-territory-highlight border-destructive/50 bg-destructive/5 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Clock className="h-5 w-5" />
                  Conta agendada para exclusão
                </CardTitle>
                <CardDescription>
                  Sua conta será permanentemente excluída em{" "}
                  {deletionStatus.days_remaining} dias (
                  {new Date(
                    deletionStatus.scheduled_purge_at!,
                  ).toLocaleDateString("pt-BR")}
                  ).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Durante esse período você ainda pode cancelar a exclusão.
                  Depois da data final, os dados não poderão ser recuperados.
                </p>
                <Button
                  variant="outline"
                  onClick={handleCancelDeletion}
                  className="w-full border-destructive text-destructive hover:bg-destructive/10 sm:w-auto"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar exclusão da conta
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Direitos do titular
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Controle dos seus dados
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Esta área concentra exportação, consentimentos e fluxos de
                exclusão conforme a política de privacidade e a LGPD.
              </p>
            </div>
          </section>

          <div className="mt-5 space-y-5">
            <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Meus dados
                </CardTitle>
                <CardDescription>
                  Acesse uma cópia estruturada dos seus dados pessoais.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  O arquivo inclui perfil, territórios, mensagens, operações e
                  histórico disponível para sua conta.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full sm:w-auto"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar meus dados
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Consentimentos
                </CardTitle>
                <CardDescription>
                  Gerencie permissões de uso e tratamento de dados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {consentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(consentLabels).map(([type, label]) => {
                      const consent = consents?.find(
                        (item) => item.consent_type === type,
                      );
                      return (
                        <ConsentRow
                          key={type}
                          type={type}
                          label={label}
                          consent={consent}
                          disabled={updateConsentMutation.isPending}
                          onChange={(checked) =>
                            updateConsentMutation.mutate({
                              consentType: type,
                              granted: checked,
                            })
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-territory-highlight border-destructive/50 bg-territory-surface shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Excluir conta
                </CardTitle>
                <CardDescription>
                  Solicite a remocao definitiva da conta e dos dados associados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div className="text-sm">
                    <p className="mb-1 font-medium text-destructive">
                      Esta ação não pode ser desfeita após 30 dias
                    </p>
                    <p className="leading-6 text-muted-foreground">
                      Sua conta é desativada imediatamente e os dados entram em
                      fila de remoção permanente. Antes do prazo final, você
                      ainda pode cancelar.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delete-reason">
                    Motivo da exclusão (opcional)
                  </Label>
                  <Textarea
                    id="delete-reason"
                    className="min-h-[120px]"
                    placeholder="Nos conte por que você está deixando a plataforma."
                    value={deleteReason}
                    onChange={(event) => setDeleteReason(event.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <AlertDialog
                  open={showDeleteConfirm}
                  onOpenChange={setShowDeleteConfirm}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      disabled={deletionStatus?.status === "scheduled"}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletionStatus?.status === "scheduled"
                        ? "Exclusão já agendada"
                        : "Solicitar exclusão da conta"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirmar exclusão da conta
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>Essa ação vai:</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                          <li>Desativar o acesso imediatamente</li>
                          <li>Remover dados pessoais em 30 dias</li>
                          <li>Cancelar assinaturas ativas</li>
                          <li>Anonimizar conteúdo quando aplicável</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Confirmar exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>

            <section className="space-y-2">
              <h3 className="mb-3 font-medium text-foreground">
                Documentos relacionados
              </h3>
              <a
                href="/privacidade"
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/90 p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Política de Privacidade
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="/termos"
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/90 p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Termos de Uso</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="/dpo"
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/90 p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Falar com o Encarregado de Dados
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
