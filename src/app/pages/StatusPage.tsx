/**
 * Status Page
 * 
 * Página pública mostrando status do sistema
 * 
 * @version 1.0.0
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database?: CheckResult;
    storage?: CheckResult;
    auth?: CheckResult;
  };
  version: string;
  uptime?: number;
}

interface CheckResult {
  status: 'healthy' | 'unhealthy';
  duration_ms: number;
  error?: string;
  details?: {
    response_time_category?: string;
    [key: string]: unknown;
  };
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    checkHealth();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await response.json();
      setHealth(data);
      setLastCheck(new Date());
    } catch (error) {
      logger.error('Failed to check health:', error);
      setHealth({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {},
        version: '1.0.0',
      });
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Operacional</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degradado</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-500">Indisponível</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  }

  function formatUptime(seconds?: number) {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando status do sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Status do Sistema</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real da plataforma Ordax
          </p>
        </div>

        {/* Status Geral */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(health?.status || 'unhealthy')}
                <div>
                  <CardTitle>Status Geral</CardTitle>
                  <CardDescription>
                    Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(health?.status || 'unhealthy')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Versão</p>
                <p className="text-lg font-semibold">{health?.version || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-semibold">{formatUptime(health?.uptime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Serviços</h2>

          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(health?.checks.database?.status || 'unhealthy')}
                  <div>
                    <CardTitle>Banco de Dados</CardTitle>
                    <CardDescription>PostgreSQL via Supabase</CardDescription>
                  </div>
                </div>
                {getStatusBadge(health?.checks.database?.status || 'unhealthy')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tempo de resposta</span>
                  <span className="text-sm font-medium">
                    {health?.checks.database?.duration_ms || 0}ms
                  </span>
                </div>
                {health?.checks.database?.details?.response_time_category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Categoria</span>
                    <span className="text-sm font-medium capitalize">
                      {health.checks.database.details.response_time_category}
                    </span>
                  </div>
                )}
                {health?.checks.database?.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                    {health.checks.database.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(health?.checks.storage?.status || 'unhealthy')}
                  <div>
                    <CardTitle>Armazenamento</CardTitle>
                    <CardDescription>Supabase Storage</CardDescription>
                  </div>
                </div>
                {getStatusBadge(health?.checks.storage?.status || 'unhealthy')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tempo de resposta</span>
                  <span className="text-sm font-medium">
                    {health?.checks.storage?.duration_ms || 0}ms
                  </span>
                </div>
                {health?.checks.storage?.details?.response_time_category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Categoria</span>
                    <span className="text-sm font-medium capitalize">
                      {health.checks.storage.details.response_time_category}
                    </span>
                  </div>
                )}
                {health?.checks.storage?.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                    {health.checks.storage.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auth */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(health?.checks.auth?.status || 'unhealthy')}
                  <div>
                    <CardTitle>Autenticação</CardTitle>
                    <CardDescription>Supabase Auth</CardDescription>
                  </div>
                </div>
                {getStatusBadge(health?.checks.auth?.status || 'unhealthy')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tempo de resposta</span>
                  <span className="text-sm font-medium">
                    {health?.checks.auth?.duration_ms || 0}ms
                  </span>
                </div>
                {health?.checks.auth?.details?.response_time_category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Categoria</span>
                    <span className="text-sm font-medium capitalize">
                      {health.checks.auth.details.response_time_category}
                    </span>
                  </div>
                )}
                {health?.checks.auth?.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                    {health.checks.auth.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Atualização automática a cada 30 segundos</p>
          <p className="mt-1">
            <Clock className="inline h-4 w-4 mr-1" />
            Última atualização: {lastCheck.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
