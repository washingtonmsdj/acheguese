import React from "react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Shield,
  AlertTriangle,
  Clock,
  Flag,
  FileText,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { PendingPostsQueue } from "@/modules/admin/components/moderation/PendingPostsQueue";
import { PendingCommentsQueue } from "@/modules/admin/components/moderation/PendingCommentsQueue";
import { useModerationStats } from "@/core/moderation/hooks/useModerationStats";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import type { ModerationStats } from "@/core/moderation/types";

export default function AdminModeracaoCompleta() {
  const { canModerate, isChecking } = useAdminGuard();
  const [selectedTab, setSelectedTab] = useState("posts-pendentes");
  const { data: stats, isLoading: statsLoading } = useModerationStats();

  // Validação de admin
  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display mb-2">
          Moderação Completa
        </h1>
        <p className="text-muted-foreground">
          Gerencie posts denunciados, comentários e conteúdo da comunidade
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Posts Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.pending_posts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando moderação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              Comentários Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.pending_comments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando moderação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              Total de Denúncias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.today_reports || 0} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.avg_resolution_time || "0h"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.today_resolved || 0} resolvidos hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="posts-pendentes">
            <FileText className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments-pendentes">
            <MessageSquare className="w-4 h-4 mr-2" />
            Comentários
          </TabsTrigger>
          <TabsTrigger value="denuncias">
            <Flag className="w-4 h-4 mr-2" />
            Denúncias
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Posts Pendentes Tab */}
        <TabsContent value="posts-pendentes" className="space-y-4">
          <PendingPostsQueue />
        </TabsContent>

        {/* Comentários Pendentes Tab */}
        <TabsContent value="comments-pendentes" className="space-y-4">
          <PendingCommentsQueue />
        </TabsContent>

        {/* Denúncias Tab */}
        <TabsContent value="denuncias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Denúncias</CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
              <p className="text-sm text-muted-foreground">
                Visualização completa de todas as denúncias será implementada em
                breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico Tab */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Moderações</CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
              <p className="text-sm text-muted-foreground">
                Histórico completo de ações de moderação será implementado em
                breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Posts Moderados
                  </span>
                  <span className="text-lg font-bold">
                    {stats?.today_resolved || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Denúncias Hoje
                  </span>
                  <span className="text-lg font-bold">
                    {stats?.today_reports || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Usuários Banidos
                  </span>
                  <span className="text-lg font-bold">
                    {stats?.banned_users || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo de Resolução</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {stats?.avg_resolution_time || "0h"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tempo médio de resolução
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gráficos Detalhados</CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
              <p className="text-sm text-muted-foreground">
                Gráficos e análises detalhadas serão implementados em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
