import { useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cookie,
  Download,
  FileClock,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageCircleMore,
  RefreshCw,
  Settings2,
  Shield,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  PrivacySettingsService,
  type ConsentHistoryRecord,
  type UserConsentRecord,
} from "@/core/privacy/services/PrivacySettingsService";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
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
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  DATA_PROTECTION_CONTACT_PATH,
  SUPPORT_PATH,
} from "@/shared/constants/legal";
import { useToast } from "@/shared/hooks/use-toast";

type UserConsent = UserConsentRecord;

const CONSENT_LABELS: Readonly<Record<string, string>> = {
  analytics: "Medição de uso",
  marketing: "Ofertas e novidades",
  cookies: "Cookies não essenciais",
  geolocation: "Localização",
  notifications: "Notificações push",
  data_processing: "Processamento de dados",
  third_party: "Compartilhamento com terceiros",
  terms_of_service: "Termos de uso",
  privacy_policy: "Política de privacidade",
};

function Surface({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-2xl border border-territory-border bg-territory-surface ${className}`}>
      {children}
    </section>
  );
}

function getConsentIcon(type: string) {
  switch (type) {
    case "cookies": return Cookie;
    case "analytics": return BarChart3;
    case "marketing": return Tag;
    case "geolocation": return MapPin;
    case "notifications": return Mail;
    case "data_processing": return Shield;
    case "third_party": return UsersRound;
    default: return FileText;
  }
}

function ConsentRow({
  type,
  label,
  description,
  consent,
  disabled,
  onChange,
  idPrefix,
}: {
  type: string;
  label: string;
  description: string;
  consent?: UserConsent;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  idPrefix: string;
}) {
  const Icon = getConsentIcon(type);
  const id = `${idPrefix}-consent-${type}`;

  return (
    <div className="flex min-h-[66px] items-center gap-3 border-b border-territory-border py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-semibold text-territory-ink">{label}</Label>
        <p className="mt-0.5 text-xs leading-4 text-territory-muted">{description}</p>
      </div>
      <Switch
        id={id}
        checked={consent?.granted ?? false}
        onCheckedChange={onChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}

function ExportItem({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-territory-border py-4 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">{icon}</span>
      <div>
        <h2 className="text-sm font-semibold text-territory-ink">{title}</h2>
        <p className="mt-1 text-xs leading-4 text-territory-muted">{description}</p>
      </div>
    </div>
  );
}

function QueryErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Não foi possível confirmar este estado.</p>
          <p className="mt-1 leading-5">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex min-h-9 items-center gap-2 font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDeletionDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR");
}

function formatConsentTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return date.toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ConsentHistoryItem({ record }: { record: ConsentHistoryRecord }) {
  const Icon = getConsentIcon(record.consent_type);
  const revoked = Boolean(record.revoked_at);
  const status = revoked ? "Revogado" : record.granted ? "Concedido" : "Negado";
  const statusClass = revoked
    ? "bg-territory-raised text-territory-muted"
    : record.granted
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-900";

  return (
    <article className="border-b border-territory-border py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-territory-ink">
              {CONSENT_LABELS[record.consent_type] ?? record.consent_type}
            </h2>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
              {status}
            </span>
          </div>
          <p className="mt-1 text-xs text-territory-muted">
            Registrado em {formatConsentTimestamp(record.created_at || record.granted_at)}
          </p>
          {record.revoked_at ? (
            <p className="mt-1 text-xs text-territory-muted">
              Revogado em {formatConsentTimestamp(record.revoked_at)}
            </p>
          ) : null}
          {record.revoke_reason ? (
            <p className="mt-2 text-xs leading-4 text-territory-muted">Motivo: {record.revoke_reason}</p>
          ) : null}
          {(record.terms_version || record.privacy_policy_version) ? (
            <p className="mt-2 text-xs leading-4 text-territory-muted">
              {record.terms_version ? `Termos ${record.terms_version}` : ""}
              {record.terms_version && record.privacy_policy_version ? " · " : ""}
              {record.privacy_policy_version ? `Privacidade ${record.privacy_policy_version}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function PrivacySettingsPage() {
  const appUrls = useAppUrls();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  const exportView = location.hash === "#exportar";
  const historyView = location.hash === "#historico";

  const {
    data: consents,
    isLoading: consentsLoading,
    isError: consentsError,
    refetch: refetchConsents,
  } = useQuery({
    queryKey: ["user-consents", user?.id],
    queryFn: async () => PrivacySettingsService.getUserConsents(user!.id),
    enabled: !!user?.id,
  });

  const {
    data: consentHistory,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["consent-history", user?.id],
    queryFn: async () => PrivacySettingsService.getConsentHistory(user!.id),
    enabled: !!user?.id && historyView,
  });

  const {
    data: deletionStatus,
    isLoading: deletionStatusLoading,
    isError: deletionStatusError,
    refetch: refetchDeletionStatus,
  } = useQuery({
    queryKey: ["deletion-status", user?.id],
    queryFn: async () => PrivacySettingsService.getDeletionStatus(user!.id),
    enabled: !!user?.id,
  });

  const updateConsentMutation = useMutation({
    mutationFn: async ({ consentType, granted }: { consentType: string; granted: boolean }) => {
      await PrivacySettingsService.recordConsent({
        userId: user!.id,
        consentType,
        granted,
        userAgent: navigator.userAgent,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-consents", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["consent-history", user?.id] }),
      ]);
      toast({ title: "Preferência atualizada", description: "Sua preferência de privacidade foi salva." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar a preferência.", variant: "destructive" });
    },
  });

  if (!user) return <Navigate to={appUrls.auth.login} replace />;

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const accessToken = await PrivacySettingsService.getAccessToken();
      const blob = await PrivacySettingsService.exportUserData(accessToken);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `meus-dados-${user.id.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      toast({ title: "Dados exportados", description: "Seus dados foram exportados com sucesso." });
    } catch {
      toast({ title: "Erro na exportação", description: "Não foi possível exportar seus dados.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletionStatusLoading || deletionStatusError || deletionStatus?.status === "scheduled") return;

    setDeleting(true);
    try {
      const accessToken = await PrivacySettingsService.getAccessToken();
      const result = await PrivacySettingsService.requestAccountDeletion({ accessToken, reason: deleteReason.trim() });
      await queryClient.invalidateQueries({ queryKey: ["deletion-status", user.id] });
      toast({
        title: "Solicitação registrada",
        description: `A exclusão foi solicitada. Prazo informado pelo serviço: ${result.days_until_purge} dias.`,
      });
      setDeleteReason("");
      setDeleteAcknowledged(false);
      setShowDeleteConfirm(false);
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: (error instanceof Error ? error.message : null) || "Não foi possível solicitar a exclusão da conta.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (cancellingDeletion) return;
    setCancellingDeletion(true);
    try {
      await PrivacySettingsService.cancelAccountDeletion();
      await queryClient.invalidateQueries({ queryKey: ["deletion-status", user.id] });
      toast({ title: "Exclusão cancelada", description: "Sua conta não será mais excluída." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível cancelar a exclusão.", variant: "destructive" });
    } finally {
      setCancellingDeletion(false);
    }
  };

  const consentRows = [
    ["analytics", "Medição de uso", "Ajuda a melhorar a experiência."],
    ["marketing", "Ofertas e novidades", "Permite sugestões e comunicações promocionais."],
    ["cookies", "Cookies não essenciais", "Preferências e recursos que não são estritamente necessários."],
    ["geolocation", "Localização neste dispositivo", "Uso da localização quando você autorizar."],
    ["notifications", "Notificações push", "Permissão de avisos no dispositivo."],
    ["data_processing", "Processamento de dados", "Consentimentos aplicáveis ao tratamento de dados."],
    ["third_party", "Compartilhamento com terceiros", "Compartilhamentos que dependem de consentimento."],
  ] as const;

  const scheduled = deletionStatus?.status === "scheduled";
  const scheduledDate = formatDeletionDate(deletionStatus?.scheduled_purge_at);

  if (exportView) {
    return (
      <>
        <Helmet><title>Exportar meus dados | Achegue-se</title></Helmet>
        <AccountSettingsShell title="Uma cópia dos seus dados" description="Baixe os dados disponibilizados para a sua conta.">
          <Surface className="px-4 sm:px-5">
            <ExportItem icon={<FileText className="h-5 w-5" aria-hidden="true" />} title="Dados da conta" description="Informações básicas e dados disponíveis no arquivo de exportação." />
            <ExportItem icon={<UsersRound className="h-5 w-5" aria-hidden="true" />} title="Perfis e registros incluídos" description="Conteúdos e configurações que o serviço de exportação disponibilizar para sua conta." />
            <ExportItem icon={<Settings2 className="h-5 w-5" aria-hidden="true" />} title="Preferências e consentimentos" description="Escolhas e registros de privacidade disponíveis no escopo da exportação." />
          </Surface>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>A exportação respeita permissões e retorna apenas os dados que o serviço autoritativo disponibiliza para a conta atual.</p>
          </div>

          <Button type="button" onClick={handleExportData} disabled={isExporting} className="mt-4 min-h-12 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90">
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
            {isExporting ? "Preparando arquivo..." : "Exportar meus dados"}
          </Button>
          <p className="mt-3 text-center text-xs text-territory-muted">Guarde o arquivo em um local seguro após o download.</p>

          <Surface className="mt-4 px-4 sm:px-5">
            <button type="button" onClick={() => navigate(SUPPORT_PATH)} className="flex min-h-14 w-full items-center gap-3 text-left text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
              <HelpCircle className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <span className="flex-1">Preciso de ajuda</span>
              <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
            </button>
          </Surface>
        </AccountSettingsShell>
      </>
    );
  }

  if (historyView) {
    return (
      <>
        <Helmet><title>Histórico de consentimentos | Achegue-se</title></Helmet>
        <AccountSettingsShell
          title="Histórico de consentimentos"
          description="Consulte os registros disponibilizados para suas escolhas de privacidade."
        >
          {historyLoading ? (
            <Surface className="flex min-h-32 items-center justify-center p-5" >
              <div className="text-center" role="status">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-territory-brand" aria-hidden="true" />
                <p className="mt-2 text-sm text-territory-muted">Carregando histórico...</p>
              </div>
            </Surface>
          ) : historyError ? (
            <Surface className="p-4 sm:p-5">
              <QueryErrorState
                message="Nenhum registro será presumido enquanto o histórico não puder ser consultado."
                onRetry={() => void refetchHistory()}
              />
            </Surface>
          ) : consentHistory && consentHistory.length > 0 ? (
            <Surface className="px-4 sm:px-5">
              {consentHistory.map((record) => (
                <ConsentHistoryItem key={record.id} record={record} />
              ))}
            </Surface>
          ) : (
            <Surface className="p-6 text-center sm:p-8">
              <FileClock className="mx-auto h-8 w-8 text-territory-brand" aria-hidden="true" />
              <h2 className="mt-3 font-heading text-base font-bold text-territory-ink">Nenhum registro disponível</h2>
              <p className="mt-1 text-sm text-territory-muted">Quando houver registros de consentimento disponíveis para sua conta, eles aparecerão aqui.</p>
            </Surface>
          )}

          <Surface className="mt-4 px-4 sm:px-5">
            <button type="button" onClick={() => navigate(DATA_PROTECTION_CONTACT_PATH)} className="flex min-h-14 w-full items-center gap-3 text-left text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
              <MessageCircleMore className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block">Falar sobre meus dados</span>
                <span className="mt-0.5 block text-xs font-normal text-territory-muted">Abra o canal existente de contato com proteção de dados.</span>
              </span>
              <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
            </button>
          </Surface>
        </AccountSettingsShell>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Privacidade e dados | Achegue-se</title></Helmet>
      <AccountSettingsShell
        title={scheduled ? "Exclusão da conta solicitada" : "Suas escolhas, seus dados"}
        description={scheduled ? "Consulte o andamento e as opções ainda disponíveis." : "Você no controle da sua privacidade."}
      >
        {deletionStatusLoading ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-territory-border bg-territory-surface p-4 text-sm text-territory-muted" role="status">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-territory-brand" aria-hidden="true" />
            Confirmando o estado da conta antes de liberar ações sensíveis...
          </div>
        ) : null}
        {deletionStatusError ? (
          <div className="mb-4">
            <QueryErrorState
              message="Ações de exclusão ficam indisponíveis até que o estado atual da conta seja confirmado."
              onRetry={() => void refetchDeletionStatus()}
            />
          </div>
        ) : null}

        {scheduled ? (
          <>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800" role="status">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Solicitação registrada
              </div>
            </div>
            <Surface className="mt-4 p-4 sm:p-5">
              <h2 className="font-heading text-base font-bold text-territory-ink">Antes da conclusão</h2>
              <p className="mt-2 text-sm leading-5 text-territory-muted">
                O processamento segue as condições registradas na solicitação. Enquanto o cancelamento estiver permitido, você pode manter a conta.
              </p>
              {scheduledDate ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-territory-raised p-3 text-sm text-territory-muted">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
                  <span>Data informada para processamento: {scheduledDate}.</span>
                </div>
              ) : null}
              <Button type="button" variant="outline" className="mt-4 min-h-11 w-full" onClick={handleCancelDeletion} disabled={cancellingDeletion}>
                {cancellingDeletion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />}
                {cancellingDeletion ? "Cancelando..." : "Cancelar solicitação"}
              </Button>
              <Button type="button" variant="link" className="mt-2 w-full text-territory-brand" onClick={() => navigate(ACCOUNT_PATHS.exportData)}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Exportar meus dados
              </Button>
            </Surface>

            <Surface className="mt-4 px-4 sm:px-5">
              <button type="button" onClick={() => navigate(ACCOUNT_PATHS.profiles)} className="flex min-h-16 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
                <UsersRound className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-territory-ink">Perfis e equipes</span>
                  <span className="mt-0.5 block text-xs leading-4 text-territory-muted">Confira o impacto nos perfis e contextos que você administra.</span>
                </span>
                <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
              </button>
            </Surface>

            <Surface className="mt-4 px-4 sm:px-5">
              <button type="button" onClick={() => navigate(SUPPORT_PATH)} className="flex min-h-14 w-full items-center gap-3 text-left text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
                <HelpCircle className="h-5 w-5 text-territory-brand" aria-hidden="true" />
                <span className="flex-1">Preciso de ajuda</span>
                <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
              </button>
            </Surface>
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Surface className="p-4 sm:p-5">
              <h2 className="font-heading text-base font-bold text-territory-ink">Preferências de dados</h2>
              <div className="mt-2">
                {consentsLoading ? (
                  <div className="flex items-center justify-center py-8" role="status"><Loader2 className="h-6 w-6 animate-spin text-territory-brand" aria-hidden="true" /></div>
                ) : consentsError ? (
                  <QueryErrorState message="Suas escolhas não serão presumidas como desativadas." onRetry={() => void refetchConsents()} />
                ) : (
                  consentRows.slice(0, 2).map(([type, label, description]) => (
                    <ConsentRow
                      key={type}
                      idPrefix="summary"
                      type={type}
                      label={label}
                      description={description}
                      consent={consents?.find((item) => item.consent_type === type)}
                      disabled={updateConsentMutation.isPending}
                      onChange={(checked) => updateConsentMutation.mutate({ consentType: type, granted: checked })}
                    />
                  ))
                )}
              </div>
              {!consentsError ? (
                <button type="button" className="mt-3 flex min-h-10 w-full items-center justify-between text-left text-sm font-medium text-territory-brand" onClick={() => document.getElementById("privacy-more")?.scrollIntoView({ behavior: "smooth" })}>
                  Cookies e permissões
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </Surface>

            <div className="grid gap-4">
              <Surface className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Download className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading text-base font-bold text-territory-ink">Exportar meus dados</h2>
                    <p className="mt-1 text-sm leading-5 text-territory-muted">Veja o que será preparado antes de iniciar o download.</p>
                  </div>
                </div>
                <Button type="button" variant="outline" className="mt-4 min-h-11 w-full" onClick={() => navigate(ACCOUNT_PATHS.exportData)}>
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Abrir exportação
                </Button>
              </Surface>

              <Surface className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
                  <div>
                    <h2 className="font-heading text-base font-bold text-territory-ink">Visibilidade dos perfis</h2>
                    <p className="mt-1 text-sm leading-5 text-territory-muted">Defina o que aparece em cada identidade pelo gerenciamento de perfis.</p>
                  </div>
                </div>
                <Button type="button" variant="link" className="mt-2 px-0 text-territory-brand" onClick={() => navigate(ACCOUNT_PATHS.profiles)}>Abrir Meus perfis</Button>
              </Surface>
            </div>
          </div>
        )}

        {!scheduled ? (
          <Surface id="privacy-more" className="mt-4 p-4 sm:p-5">
            <h2 className="font-heading text-base font-bold text-territory-ink">Consentimentos e permissões</h2>
            <p className="mt-1 text-sm text-territory-muted">Os controles existentes no produto continuam disponíveis além do recorte visual do concept.</p>
            <div className="mt-2 grid gap-x-6 lg:grid-cols-2">
              {consentsLoading ? (
                <div className="col-span-full flex items-center justify-center py-8" role="status"><Loader2 className="h-6 w-6 animate-spin text-territory-brand" aria-hidden="true" /></div>
              ) : consentsError ? (
                <div className="col-span-full"><QueryErrorState message="Não exibimos estados padrão quando a autoridade de consentimento está indisponível." onRetry={() => void refetchConsents()} /></div>
              ) : (
                consentRows.map(([type, label, description]) => (
                  <ConsentRow
                    key={type}
                    idPrefix="details"
                    type={type}
                    label={label}
                    description={description}
                    consent={consents?.find((item) => item.consent_type === type)}
                    disabled={updateConsentMutation.isPending}
                    onChange={(checked) => updateConsentMutation.mutate({ consentType: type, granted: checked })}
                  />
                ))
              )}
            </div>
          </Surface>
        ) : null}

        {!scheduled ? (
          <Surface className="mt-4 px-4 sm:px-5">
            <button type="button" onClick={() => navigate(ACCOUNT_PATHS.consentHistory)} className="flex min-h-14 w-full items-center gap-3 border-b border-territory-border text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
              <FileClock className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-territory-ink">Histórico de consentimentos</span>
                <span className="mt-0.5 block text-xs text-territory-muted">Consulte registros disponíveis das suas escolhas de privacidade.</span>
              </span>
              <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => navigate(DATA_PROTECTION_CONTACT_PATH)} className="flex min-h-14 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
              <MessageCircleMore className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-territory-ink">Falar sobre meus dados</span>
                <span className="mt-0.5 block text-xs text-territory-muted">Entre em contato pelo canal existente de proteção de dados.</span>
              </span>
              <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
            </button>
          </Surface>
        ) : null}

        {!scheduled && !deletionStatusLoading && !deletionStatusError ? (
          <div className="mt-4 border-t border-territory-border pt-4">
            <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
              if (deleting) return;
              setShowDeleteConfirm(open);
              if (!open) setDeleteAcknowledged(false);
            }}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="min-h-11 text-destructive hover:bg-destructive/5 hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Solicitar exclusão da conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[520px] rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-heading text-xl">Solicitar exclusão da sua conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Confira o impacto antes de continuar. O prazo e as condições finais são definidos pelo serviço de exclusão quando a solicitação é registrada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 text-sm text-territory-muted">
                  <div className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Você perderá o acesso após a conclusão do fluxo.</span></div>
                  <div className="flex items-start gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Revise os perfis e contextos que você administra.</span></div>
                  <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Alguns registros podem ser mantidos conforme obrigações e condições aplicáveis.</span></div>
                  <div>
                    <Label htmlFor="delete-reason">Motivo (opcional)</Label>
                    <Textarea
                      id="delete-reason"
                      value={deleteReason}
                      onChange={(event) => setDeleteReason(event.target.value.slice(0, 500))}
                      disabled={deleting}
                      className="mt-2 min-h-[92px]"
                      placeholder="Conte-nos, se quiser."
                      maxLength={500}
                    />
                    <p className="mt-1 text-right text-xs text-territory-muted">{deleteReason.length}/500</p>
                  </div>
                  <Button type="button" variant="link" disabled={deleting} className="h-auto p-0 text-territory-brand" onClick={() => {
                    setShowDeleteConfirm(false);
                    navigate(ACCOUNT_PATHS.exportData);
                  }}>
                    Exportar meus dados antes
                  </Button>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-territory-ink">
                    <input
                      type="checkbox"
                      checked={deleteAcknowledged}
                      onChange={(event) => setDeleteAcknowledged(event.target.checked)}
                      disabled={deleting}
                      className="mt-0.5 h-4 w-4 rounded border-territory-border"
                    />
                    <span>Entendi as consequências da solicitação.</span>
                  </label>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Manter minha conta</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDeleteAccount();
                    }}
                    disabled={!deleteAcknowledged || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    {deleting ? "Solicitando..." : "Solicitar exclusão"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
      </AccountSettingsShell>
    </>
  );
}
