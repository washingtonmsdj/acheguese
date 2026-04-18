/**
 * AdminIdentidadeTableSection Component
 * 
 * Tabela de perfis
 */

import { UserCog } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import {
  AdminDataState,
  AdminErrorState,
  AdminPagination,
  AdminSectionCard,
  AdminTable,
} from "@/modules/admin/components";
import type { AdminIdentidadeTableSectionProps } from "./types";
import { StatusBadge, PlanBadge, IssueBadge } from "../components/badges";
import { label } from "../utils";

export function AdminIdentidadeTableSection({
  profiles,
  loading,
  error,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onSelectProfile,
  onRetry,
}: AdminIdentidadeTableSectionProps) {
  return (
    <AdminSectionCard
      title="Fila de identidade"
      description="Leitura administrativa canonica do dominio `profile`, cobrindo exposicao publica, governanca da conta e riscos estruturais."
      icon={UserCog}
    >
      {error ? (
        <AdminErrorState
          title="Falha ao carregar a fila de identidade"
          description="A leitura canonica de perfis nao ficou disponivel para o admin nesta tentativa."
          onRetry={onRetry}
        />
      ) : (
        <AdminDataState
          loading={loading}
          isEmpty={!loading && !profiles.length}
          emptyTitle="Nenhum perfil encontrado"
          emptyDescription="Nenhum perfil corresponde aos filtros atuais."
        >
          <AdminTable
            footer={
              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={20}
                onPageChange={onPageChange}
              />
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Governanca</TableHead>
                <TableHead>Riscos</TableHead>
                <TableHead className="text-right">Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="min-w-[260px]">
                    <div className="space-y-1">
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {label(profile.profileType)}
                        {profile.username ? ` - @${profile.username}` : " - sem username"}
                      </div>
                      <div>
                        <StatusBadge profile={profile} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <PlanBadge plan={profile.activePlan} />
                        {profile.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {role}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profile.accountProfileCount} perfil(is) - {profile.linkedEntityCount}{" "}
                        vinculo(s) - {profile.usernameHistoryCount} mudanca(s)
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <div className="flex flex-wrap gap-2">
                      {profile.issues.length ? (
                        profile.issues.map((issue) => (
                          <IssueBadge key={issue} issue={issue} />
                        ))
                      ) : (
                        <Badge variant="outline">Sem riscos</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectProfile(profile.id)}
                    >
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AdminTable>
        </AdminDataState>
      )}
    </AdminSectionCard>
  );
}
