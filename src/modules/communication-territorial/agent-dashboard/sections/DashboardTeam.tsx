import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Users, UserPlus, Shield, Edit, Trash2 } from "lucide-react";
import type { DashboardChannelView, DashboardTeamMemberView } from "../../types/agentDashboardViewModels";

interface DashboardTeamProps {
  channel: DashboardChannelView;
}

export function DashboardTeam({ channel }: DashboardTeamProps) {
  const teamMembers: DashboardTeamMemberView[] = [];
  const channelName = channel.public_name || channel.name || "canal";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipe</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie editores e colaboradores de {channelName}</p>
        </div>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Membro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcoes e permissoes</CardTitle>
          <CardDescription>Entenda as diferentes funcoes da equipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Administrador</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso total, incluindo configuracoes e gestao de equipe
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Editor</h4>
              </div>
              <p className="text-sm text-muted-foreground">Pode criar, editar e publicar conteudo</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Colaborador</h4>
              </div>
              <p className="text-sm text-muted-foreground">Pode criar rascunhos que precisam de aprovacao</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Pessoas com acesso ao canal</CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum membro adicional</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Convide editores e colaboradores para ajudar na gestao do canal
              </p>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{member.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Badge variant="secondary">{member.role}</Badge>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
