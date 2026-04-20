/**
 * ══════════════════════════════════════════════════════════════════════════
 * PRIVACY SETTINGS PAGE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Página de configurações de privacidade e LGPD.
 * Permite exportar dados, solicitar exclusão de conta e gerenciar consentimentos.
 *
 * LGPD: Art. 18 - Direitos do titular de dados
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Trash2,
  Shield,
  FileText,
  AlertTriangle,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Cookie,
  MapPin,
  Bell,
  Mail,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
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
} from '@/shared/components/ui/alert-dialog';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/core/auth/hooks/useAuth';
import {
  PrivacySettingsService,
  type UserConsentRecord,
  type DeletionStatusRecord,
} from '@/core/privacy/services/PrivacySettingsService';

type UserConsent = UserConsentRecord;
type DeletionStatus = DeletionStatusRecord;

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Buscar consentimentos do usuário
  const { data: consents, isLoading: consentsLoading } = useQuery({
    queryKey: ['user-consents', user?.id],
    queryFn: async () => PrivacySettingsService.getUserConsents(user!.id),
    enabled: !!user?.id,
  });

  // Buscar status de deleção
  const { data: deletionStatus, isLoading: deletionLoading } = useQuery({
    queryKey: ['deletion-status', user?.id],
    queryFn: async () => PrivacySettingsService.getDeletionStatus(user!.id),
    enabled: !!user?.id,
  });

  // Mutação para atualizar consentimento
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
      queryClient.invalidateQueries({ queryKey: ['user-consents', user?.id] });
      toast({
        title: 'Preferência atualizada',
        description: 'Sua preferência de privacidade foi salva.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a preferência.',
        variant: 'destructive',
      });
    },
  });

  // Exportar dados (LGPD Art. 18, I)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const accessToken = await PrivacySettingsService.getAccessToken();
      const blob = await PrivacySettingsService.exportUserData(
        import.meta.env.VITE_SUPABASE_URL,
        accessToken,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${user?.id?.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Dados exportados!',
        description: 'Seus dados foram exportados com sucesso (LGPD Art. 18).',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar seus dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Solicitar exclusão de conta (LGPD Art. 18, VI)
  const handleDeleteAccount = async () => {
    try {
      const accessToken = await PrivacySettingsService.getAccessToken();
      const result = await PrivacySettingsService.requestAccountDeletion({
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        accessToken,
        reason: deleteReason,
      });

      queryClient.invalidateQueries({
        queryKey: ['deletion-status', user?.id],
      });

      toast({
        title: 'Conta agendada para exclusão',
        description: `Sua conta será excluída em ${result.days_until_purge} dias. Você pode cancelar até lá.`,
      });

      setShowDeleteConfirm(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description:
          error.message || 'Não foi possível solicitar a exclusão da conta.',
        variant: 'destructive',
      });
    }
  };

  // Cancelar exclusão
  const handleCancelDeletion = async () => {
    try {
      await PrivacySettingsService.cancelAccountDeletion(user!.id);

      queryClient.invalidateQueries({
        queryKey: ['deletion-status', user?.id],
      });

      toast({
        title: 'Exclusão cancelada',
        description: 'Sua conta não será mais excluída.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a exclusão.',
        variant: 'destructive',
      });
    }
  };

  const consentIcons: Record<string, React.ReactNode> = {
    cookies: <Cookie className="h-5 w-5" />,
    analytics: <FileText className="h-5 w-5" />,
    marketing: <Mail className="h-5 w-5" />,
    geolocation: <MapPin className="h-5 w-5" />,
    notifications: <Bell className="h-5 w-5" />,
    data_processing: <Shield className="h-5 w-5" />,
    third_party: <FileText className="h-5 w-5" />,
    terms_of_service: <FileText className="h-5 w-5" />,
    privacy_policy: <Shield className="h-5 w-5" />,
  };

  const consentLabels: Record<string, string> = {
    cookies: 'Cookies não essenciais',
    analytics: 'Analytics e métricas',
    marketing: 'Marketing e promoções',
    geolocation: 'Geolocalização precisa',
    notifications: 'Notificações push',
    data_processing: 'Processamento de dados',
    third_party: 'Compartilhamento com terceiros',
    terms_of_service: 'Termos de uso',
    privacy_policy: 'Política de privacidade',
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Privacidade e Dados</h1>
        <p className="text-muted-foreground">
          Gerencie seus dados pessoais e exercite seus direitos conforme a LGPD.
        </p>
      </div>

      {/* Alerta de exclusão agendada */}
      {deletionStatus?.status === 'scheduled' && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Clock className="h-5 w-5" />
              Conta agendada para exclusão
            </CardTitle>
            <CardDescription>
              Sua conta será permanentemente excluída em{' '}
              {deletionStatus.days_remaining} dias (
              {new Date(deletionStatus.scheduled_purge_at!).toLocaleDateString('pt-BR')}
              ).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Durante este período você pode cancelar a exclusão. Após a data de
              purge, seus dados serão permanentemente removidos e não poderão
              ser recuperados.
            </p>
            <Button
              variant="outline"
              onClick={handleCancelDeletion}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar exclusão da conta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Seção: Meus Dados (LGPD Art. 18) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Meus Dados
          </CardTitle>
          <CardDescription>
            LGPD Art. 18, I - Direito de acesso aos dados pessoais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Exporte uma cópia completa de todos os seus dados pessoais
            armazenados em nossa plataforma. O arquivo será baixado em formato
            JSON e conterá dados de perfil, endereços, negócios, mensagens,
            notificações e histórico de atividades.
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar meus dados
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Seção: Consentimentos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Consentimentos
          </CardTitle>
          <CardDescription>
            Gerencie seus consentimentos de uso de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(consentLabels).map(([type, label]) => {
                const consent = consents?.find((c) => c.consent_type === type);
                const isGranted = consent?.granted ?? false;

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {consentIcons[type]}
                      </div>
                      <div>
                        <Label
                          htmlFor={`consent-${type}`}
                          className="font-medium"
                        >
                          {label}
                        </Label>
                        {consent?.granted_at && (
                          <p className="text-xs text-muted-foreground">
                            {isGranted
                              ? `Concedido em ${new Date(consent.granted_at).toLocaleDateString('pt-BR')}`
                              : 'Revogado'}
                          </p>
                        )}
                      </div>
                    </div>
                    <Switch
                      id={`consent-${type}`}
                      checked={isGranted}
                      onCheckedChange={(checked) =>
                        updateConsentMutation.mutate({
                          consentType: type,
                          granted: checked,
                        })
                      }
                      disabled={updateConsentMutation.isPending}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção: Excluir Conta (LGPD Art. 18, VI) */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Conta
          </CardTitle>
          <CardDescription>
            LGPD Art. 18, VI - Direito à eliminação dos dados pessoais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-1">
                  Atenção: Esta ação não pode ser desfeita após 30 dias
                </p>
                <p className="text-muted-foreground">
                  Ao solicitar a exclusão, sua conta será imediatamente
                  desativada e todos os seus dados serão programados para
                  exclusão permanente em 30 dias. Durante este período você
                  pode cancelar a exclusão. Após esse prazo, seus dados serão
                  permanentemente removidos e não poderão ser recuperados.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-reason">
                Motivo da exclusão (opcional)
              </Label>
              <textarea
                id="delete-reason"
                className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                placeholder="Nos conte por que você está deixando a plataforma (isso nos ajuda a melhorar)..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
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
                disabled={deletionStatus?.status === 'scheduled'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deletionStatus?.status === 'scheduled'
                  ? 'Exclusão já agendada'
                  : 'Solicitar exclusão da conta'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmar exclusão da conta
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Tem certeza que deseja excluir sua conta? Esta ação irá:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Desativar seu acesso imediatamente</li>
                    <li>Remover seus dados pessoais em 30 dias</li>
                    <li>Cancelar todas as assinaturas ativas</li>
                    <li>Anonimizar suas mensagens e posts</li>
                    <li>
                      <strong>Esta ação não pode ser desfeita após 30 dias</strong>
                    </li>
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

      {/* Links úteis */}
      <div className="mt-8 space-y-2">
        <h3 className="font-medium mb-3">Documentos relacionados</h3>
        <a
          href="/privacidade"
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Política de Privacidade</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>
        <a
          href="/termos"
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Termos de Uso</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>
        <a
          href="/dpo"
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              Falar com o Encarregado de Dados (DPO)
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}
