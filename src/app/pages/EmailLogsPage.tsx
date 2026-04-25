/**
 * Email Logs Page
 * 
 * View email history and status.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useEmail } from '@/core/notifications/hooks/useEmail';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { Mail, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EmailLogsPage() {
  const { user } = useAuth();
  const { emailLogs, isLoadingLogs, refetchLogs } = useEmail(user?.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-500">Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'bounced':
        return <Badge variant="secondary" className="bg-yellow-500">Devolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    let colorClass = 'bg-gray-500';
    switch (category) {
      case 'transactional':
        colorClass = 'bg-blue-500';
        break;
      case 'social':
        colorClass = 'bg-purple-500';
        break;
      case 'system':
        colorClass = 'bg-orange-500';
        break;
      case 'marketing':
        colorClass = 'bg-pink-500';
        break;
      default:
        break;
    }

    return (
      <Badge variant="secondary" className={colorClass}>
        {category}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Histórico de Emails
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize todos os emails enviados para sua conta
            </p>
          </div>
          <Button
            onClick={() => refetchLogs()}
            disabled={isLoadingLogs}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailLogs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {emailLogs.filter((log) => log.status === 'sent').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Falharam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {emailLogs.filter((log) => log.status === 'failed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Devolvidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {emailLogs.filter((log) => log.status === 'bounced').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <Card>
          <CardHeader>
            <CardTitle>Emails Enviados</CardTitle>
            <CardDescription>
              Últimos 50 emails enviados para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum email enviado ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-1">{getStatusIcon(log.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{log.subject}</h3>
                        {getStatusBadge(log.status)}
                        {getCategoryBadge(log.category)}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        Para: {log.recipient_email}
                      </p>

                      {log.error_message && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2 mb-2">
                          <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>Erro:</strong> {log.error_message}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.sent_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Sobre os Emails</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Transacionais:</strong> Emails importantes relacionados à sua conta
              (confirmações, redefinição de senha, etc.)
            </p>
            <p>
              <strong>Sistema:</strong> Notificações do sistema (alertas de segurança, MFA, etc.)
            </p>
            <p>
              <strong>Sociais:</strong> Notificações de interações sociais (mensagens, comentários, etc.)
            </p>
            <p>
              <strong>Marketing:</strong> Promoções e novidades (pode ser desativado nas preferências)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
