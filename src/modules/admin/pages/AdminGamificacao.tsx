import React from "react";
import { useState, useEffect } from "react";
import { Loader2, Trophy, Medal, Star, Search, Shield } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services";

export default function AdminGamificacao() {
  const { canModerate, isChecking } = useAdminGuard();
  const [users, setUsers] = useState<
    Array<{
      id: string;
      name: string;
      pontos?: number;
      avatar_url?: string;
      neighborhood?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isChecking && canModerate) {
      profileService.getAllUsers()
        .then((u) => {
          const usersWithNeighborhood = u.map((user) => ({
            ...user,
            pontos: user.reputation || 0,
            neighborhood: null, // getAllUsers não retorna neighborhood
          }));
          setUsers(usersWithNeighborhood.sort((a, b) => (b.pontos ?? 0) - (a.pontos ?? 0)));
        })
        .catch((error) => {
          logger.error(
            "Erro ao carregar dados de gamificação",
            error as Error,
            {
              component: "AdminGamificacao",
              action: "loadData",
            },
          );
        })
        .finally(() => setLoading(false));
    }
  }, [canModerate, isChecking]);

  const filtered = users.filter(
    (u) =>
      !search.trim() ||
      (u.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPontos = users.reduce((sum, u) => sum + (u.pontos ?? 0), 0);
  const avgPontos =
    users.length > 0 ? Math.round(totalPontos / users.length) : 0;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-amber-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-slate-400" />;
    if (index === 2) return <Medal className="h-4 w-4 text-amber-700" />;
    return (
      <span className="text-xs font-mono text-muted-foreground w-4 text-center">
        {index + 1}
      </span>
    );
  };

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold font-display">Gamificação</h1>
        <p className="text-sm text-muted-foreground">
          Pontos, rankings e medalhas
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">
              {totalPontos.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total de pontos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{avgPontos}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Média por usuário
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-violet-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Usuários ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Ranking Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Usuário
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Bairro
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Pontos
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/30 transition-colors",
                      i < 3 && "bg-amber-500/[0.02]",
                    )}
                  >
                    <td className="px-4 py-3">{getRankIcon(i)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            className="h-7 w-7 rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {(u.name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">
                          {u.name || "Sem name"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {u.neighborhood || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-sm">
                        {(u.pontos ?? 0).toLocaleString("pt-BR")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
