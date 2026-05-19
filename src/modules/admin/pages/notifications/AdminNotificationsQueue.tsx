import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Filter } from "lucide-react";
import type { AdminNotificationListResult, AdminNotificationRecord } from "@/core/admin/services/AdminNotificationsService";
import {
  AdminDataState,
  AdminErrorState,
  AdminPagination,
  AdminSectionCard,
  AdminTable,
} from "@/modules/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  formatNotificationType,
  getPriorityBadge,
} from "./AdminNotifications.helpers";

interface AdminNotificationsQueueProps {
  notifications?: AdminNotificationListResult;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onSelectNotification: (notification: AdminNotificationRecord) => void;
}

export function AdminNotificationsQueue({
  notifications,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  onSelectNotification,
}: AdminNotificationsQueueProps) {
  return (
    <AdminSectionCard
      title="Fila operacional"
      description="Leitura central do backlog global de notificacoes, sem acessar o banco direto da page."
      icon={Filter}
    >
      {isError ? (
        <AdminErrorState
          title="Falha ao carregar a fila de notificacoes"
          description="O dominio `notifications` nao retornou a fila administrativa canonica nesta tentativa."
          onRetry={onRetry}
        />
      ) : (
        <AdminDataState
          loading={isLoading}
          isEmpty={!isLoading && !notifications?.data.length}
          emptyTitle="Nenhuma notificacao encontrada"
          emptyDescription="Nenhuma notificacao corresponde aos filtros atuais."
        >
          <AdminTable
            footer={
              <AdminPagination
                currentPage={notifications?.page || 1}
                totalPages={notifications?.totalPages || 1}
                totalItems={notifications?.total || 0}
                itemsPerPage={20}
                onPageChange={onPageChange}
              />
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Titulo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications?.data.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="min-w-[220px]">
                    <div className="space-y-0.5">
                      <div className="font-medium">
                        {notification.profile?.display_name ||
                          notification.profile?.name ||
                          notification.profile?.username ||
                          "Usuario sem perfil resolvido"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notification.profile?.username
                          ? `@${notification.profile.username}`
                          : notification.user_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatNotificationType(notification.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[280px]">
                    <div className="space-y-0.5">
                      <div className="font-medium">{notification.title}</div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {notification.message || "Sem mensagem"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                  <TableCell>
                    {notification.read ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        Lida
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Nao lida</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {notification.created_at
                      ? format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectNotification(notification)}
                    >
                      <Eye className="h-4 w-4" />
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
