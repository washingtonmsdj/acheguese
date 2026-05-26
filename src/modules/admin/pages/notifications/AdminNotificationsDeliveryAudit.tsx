import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { Mail } from "lucide-react";
import type { AdminEmailDeliveryAuditResult } from "@/core/admin/services/AdminNotificationsService";
import {
  AdminDataState,
  AdminErrorState,
  AdminSectionCard,
  AdminTable,
} from "@/modules/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

interface AdminNotificationsDeliveryAuditProps {
  deliveryAudit?: AdminEmailDeliveryAuditResult;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function AdminNotificationsDeliveryAudit({
  deliveryAudit,
  isLoading,
  isError,
  onRetry,
}: AdminNotificationsDeliveryAuditProps) {
  return (
    <AdminSectionCard
      title="Auditoria de entrega (e-mail)"
      description="Eventos recentes de `email_logs` para governanca de envio, entrega e falhas."
      icon={Mail}
    >
      {isError ? (
        <AdminErrorState
          title="Falha ao carregar auditoria de entrega"
          description="A leitura canonica de `email_logs` nao ficou disponivel."
          onRetry={onRetry}
        />
      ) : (
        <AdminDataState
          loading={isLoading}
          isEmpty={!isLoading && !deliveryAudit?.data.length}
          emptyTitle="Sem eventos de entrega"
          emptyDescription="Nao foram encontrados registros recentes em `email_logs`."
        >
          <AdminTable>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryAudit?.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.template}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === "failed" || item.status === "bounced" ? (
                      <Badge variant="destructive">{item.status}</Badge>
                    ) : (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        {item.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">{item.subject}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.createdAt
                      ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })
                      : "-"}
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
