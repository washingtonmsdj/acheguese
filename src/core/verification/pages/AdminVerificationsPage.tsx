/**
 * AdminVerificationsPage - Painel administrativo de verificacoes.
 */
import { CheckCircle, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { VerificationCard } from "@/core/verification/components/VerificationCard";
import { useVerifications } from "@/core/verification/hooks/useVerifications";

export default function AdminVerificationsPage() {
  const {
    pending,
    verified,
    stats,
    loadingPending,
    loadingVerified,
    isApproving,
    isRejecting,
    approve,
    reject,
  } = useVerifications();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Verificacoes de Perfil</h1>
        <p className="text-muted-foreground">
          Aprove ou rejeite solicitacoes pendentes de verificacao.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.verified || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Verificados ({verified.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma verificacao pendente no momento.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pending.map((verification) => (
                <VerificationCard
                  key={verification.id}
                  verification={verification}
                  onApprove={approve}
                  onReject={(profileId) => reject({ profileId })}
                  isApproving={isApproving}
                  isRejecting={isRejecting}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {loadingVerified ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : verified.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum perfil verificado ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {verified.map((verification) => (
                <VerificationCard
                  key={verification.id}
                  verification={verification}
                  onApprove={approve}
                  onReject={(profileId) => reject({ profileId })}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

