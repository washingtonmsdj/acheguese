import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Users, UserPlus, Shield, Edit, Trash2 } from "lucide-react";
import type { DashboardChannelView, DashboardTeamMemberView } from "../../types/agentDashboardViewModels";

interface DashboardTeamProps {
  channel: DashboardChannelView;
}

export function DashboardTeam({ channel }: DashboardTeamProps) {
  // Mock team members (future implementation will fetch from database)
  const teamMembers: DashboardTeamMemberView[] = [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipe</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie editores e colaboradores
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Membro
        </Button>
      </div>

      {/* Roles Info */}
      <Card>
        <CardHeader>
          <CardTitle>Funções e Permissões</CardTitle>
          <CardDescription>Entenda as diferentes funções da equipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Administrador</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso total, incluindo configurações e gestão de equipe
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Edit className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Editor</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Pode criar, editar e publicar conteúdo
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Colaborador</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Pode criar rascunhos que precisam de aprovação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
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
                Convide editores e colaboradores para ajudar na gestão do canal
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
