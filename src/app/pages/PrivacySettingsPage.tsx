import { useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cookie,
  Download,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  Mail,
  MapPin,
  Settings2,
  Shield,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import {
  PrivacySettingsService,
  type UserConsentRecord,
} from "@/core/privacy/services/PrivacySettingsService";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import { SUPPORT_PATH } from "@/shared/constants/legal";
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
  const isGranted = consent?.granted ?? false;
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
        checked={isGranted}
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
    mutationFn: async ({ consentType, granted }: { consentType: string; granted: boolean }) => {
      await PrivacySettingsService.recordConsent({
        userId: user!.id,
        consentType,
        granted,
        userAgent: navigator.userAgent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-consents", user?.id] });
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
    try {
      const accessToken = await PrivacySettingsService.getAccessToken();
      const result = await PrivacySettingsService.requestAccountDeletion({ accessToken, reason: deleteReason });
      queryClient.invalidateQueries({ queryKey: ["deletion-status", user.id] });
      toast({
        title: "Solicitação registrada",
        description: `A exclusão foi solicitada. Prazo informado pelo serviço: ${result.days_until_purge} dias.`,
      });
      setShowDeleteConfirm(false);
      setDeleteAcknowledged(false);
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: (error instanceof Error ? error.message : null) || "Não foi possível solicitar a exclusão da conta.",
        variant: "destructive",
      });
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await PrivacySettingsService.cancelAccountDeletion();
      queryClient.invalidateQueries({ queryKey: ["deletion-status", user.id] });
      toast({ title: "Exclusão cancelada", description: "Sua conta não será mais excluída." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível cancelar a exclusão.", variant: "destructive" });
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
  const exportView = location.hash === "#exportar";

  if (exportView) {
    return (
      <>
        <Helmet><title>Exportar meus dados | Achegue-se</title></Helmet>
        <AccountSettingsShell
          title="Uma cópia dos seus dados"
          description="Baixe os dados disponibilizados para a sua conta."
        >
          <Surface className="px-4 sm:px-5">
            <ExportItem
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title="Dados da conta"
              description="Informações básicas e dados disponíveis no arquivo de exportação."
            />
            <ExportItem
              icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
              title="Perfis e registros incluídos"
              description="Conteúdos e configurações que o serviço de exportação disponibilizar para sua conta."
            />
            <ExportItem
              icon={<Settings2 className="h-5 w-5" aria-hidden="true" />}
              title="Preferências e consentimentos"
              description="Escolhas e registros de privacidade disponíveis no escopo da exportação."
            />
          </Surface>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>A exportação respeita permissões e retorna apenas os dados que o serviço autoritativo disponibiliza para a conta atual.</p>
          </div>

          <Button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="mt-4 min-h-12 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
          >
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExporting ? "Preparando arquivo..." : "Exportar meus dados"}
          </Button>

          <p className="mt-3 text-center text-xs text-territory-muted">
            Guarde o arquivo em um local seguro após o download.
          </p>

          <Surface className="mt-4 px-4 sm:px-5">
            <button
              type="button"
              onClick={() => navigate(SUPPORT_PATH)}
              className="flex min-h-14 w-full items-center gap-3 text-left text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
            >
              <HelpCircle className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <span className="flex-1">Preciso de ajuda</span>
              <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
            </button>
          </Surface>
        </AccountSettingsShell>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Privacidade e dados | Achegue-se</title>
      </Helmet>

      <AccountSettingsShell
        title={scheduled ? "Exclusão da conta solicitada" : "Suas escolhas, seus dados"}
        description={scheduled ? "Consulte o andamento e as opções ainda disponíveis." : "Você no controle da sua privacidade."}
      >
        {scheduled ? (
          <>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
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
              {deletionStatus.scheduled_purge_at ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-territory-raised p-3 text-sm text-territory-muted">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
                  <span>Data informada para processamento: {new Date(deletionStatus.scheduled_purge_at).toLocaleDateString("pt-BR")}.</span>
                </div>
              ) : null}
              <Button type="button" variant="outline" className="mt-4 min-h-11 w-full" onClick={handleCancelDeletion}>
                <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Cancelar solicitação
              </Button>
              <Button type="button" variant="link" className="mt-2 w-full text-territory-brand" onClick={() => navigate("/conta/privacidade#exportar")}>
                <Download className="mr-2 h-4 w-4" />
                Exportar meus dados
              </Button>
            </Surface>
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Surface className="p-4 sm:p-5">
              <h2 className="font-heading text-base font-bold text-territory-ink">Preferências de dados</h2>
              <div className="mt-2">
                {consentsLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-territory-brand" /></div>
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
              <button type="button" className="mt-3 flex min-h-10 w-full items-center justify-between text-left text-sm font-medium text-territory-brand" onClick={() => document.getElementById("privacy-more")?.scrollIntoView({ behavior: "smooth" })}>
                Cookies e permissões
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
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
                <Button type="button" variant="outline" className="mt-4 min-h-11 w-full" onClick={() => navigate("/conta/privacidade#exportar")}>
                  <Download className="mr-2 h-4 w-4" />
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
                <Button type="button" variant="link" className="mt-2 px-0 text-territory-brand" onClick={() => navigate("/conta?section=profiles")}>Abrir Meus perfis</Button>
              </Surface>
            </div>
          </div>
        )}

        <Surface id="privacy-more" className="mt-4 p-4 sm:p-5">
          <h2 className="font-heading text-base font-bold text-territory-ink">Consentimentos e permissões</h2>
          <p className="mt-1 text-sm text-territory-muted">Os controles existentes no produto continuam disponíveis além do recorte visual do concept.</p>
          <div className="mt-2 grid gap-x-6 lg:grid-cols-2">
            {consentsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-territory-brand" /></div>
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

        {!scheduled ? (
          <div className="mt-4 border-t border-territory-border pt-4">
            <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
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
                  <div className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0" /><span>Você perderá o acesso após a conclusão do fluxo.</span></div>
                  <div className="flex items-start gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" /><span>Revise os perfis e contextos que você administra.</span></div>
                  <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><span>Alguns registros podem ser mantidos conforme obrigações e condições aplicáveis.</span></div>
                  <div>
                    <Label htmlFor="delete-reason">Motivo (opcional)</Label>
                    <Textarea id="delete-reason" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} className="mt-2 min-h-[92px]" placeholder="Conte-nos, se quiser." />
                  </div>
                  <Button type="button" variant="link" className="h-auto p-0 text-territory-brand" onClick={() => {
                    setShowDeleteConfirm(false);
                    navigate("/conta/privacidade#exportar");
                  }}>
                    Exportar meus dados antes
                  </Button>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-territory-ink">
                    <input type="checkbox" checked={deleteAcknowledged} onChange={(event) => setDeleteAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-territory-border" />
                    <span>Entendi as consequências da solicitação.</span>
                  </label>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter minha conta</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={!deleteAcknowledged}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Solicitar exclusão
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
