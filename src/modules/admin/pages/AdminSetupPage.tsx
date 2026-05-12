import { logger } from '@/shared/utils/logger';
import { useState } from 'react';
import { AdminService } from '@/modules/admin/services/AdminService';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { AdminUserResult } from '@/modules/admin/services/AdminService';
export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdminUserResult | null>(null);

  const createAdminUser = async () => {
    setLoading(true);
    setResult(null);

    try {
      logger.debug('🔄 Criando usuário admin...');

      // ✅ SSOT - Usa AdminService
      const response = await AdminService.createAdminUser({
        email: 'washingtonmsdj@gmail.com',
        password: 'admin12345678',
        name: 'Admin',
      });

      setResult(response);

      if (response.success) {
        logger.debug('✅ Usuário admin criado com sucesso');
      } else {
        logger.error('❌ Erro:', response.message);
      }

    } catch (error: unknown) {
      logger.error('❌ Erro:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Usuário Admin</CardTitle>
            <CardDescription>
              Crie um usuário administrador para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Detalhes do usuário:</h3>
              <div className="bg-muted p-4 rounded-lg space-y-1">
                <p><strong>Email:</strong> washingtonmsdj@gmail.com</p>
                <p><strong>Senha:</strong> admin12345678</p>
                <p className="text-sm text-muted-foreground">
                  Este usuário terá permissões de administrador no sistema.
                </p>
              </div>
            </div>

            <Button 
              onClick={createAdminUser} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando usuário...
                </>
              ) : (
                'Criar Usuário Admin'
              )}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{result.message}</p>
                    {result.success && result.userId && (
                      <p className="text-sm">
                        <strong>ID do usuário:</strong> {result.userId}
                      </p>
                    )}
                    {result.success && (
                      <div className="mt-4 p-3 bg-primary/10 rounded">
                        <p className="font-medium">Próximos passos:</p>
                        <ol className="list-decimal pl-5 space-y-1 text-sm">
                          <li>Faça login com o email e senha acima</li>
                          <li>Acesse o dashboard de administração</li>
                          <li>Configure as permissões necessárias</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Notas:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Este usuário terá acesso total ao sistema</li>
                <li>Se o usuário já existir, apenas a role de admin será adicionada</li>
                <li>Certifique-se de que o Supabase local está rodando</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
