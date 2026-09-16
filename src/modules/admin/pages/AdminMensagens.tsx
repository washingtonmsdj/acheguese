import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleStop, Eye, MessageSquare, Search, ShieldAlert } from "lucide-react";
import { adminMessagingService } from "@/core/admin";
import type { AdminConversationData } from "@/core/admin";
import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "@/shared/components/ui/use-toast";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";

const STATUS_OPTIONS = ["active", "blocked"] as const;
const ALL_STATUSES = "all";

function statusLabel(status: string): string {
  if (status === "active") return "Ativa";
  if (status === "blocked") return "Bloqueada";
  if (status === "closed") return "Encerrada";
  return status;
}

export default function AdminMensagens() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [selectedConversation, setSelectedConversation] =
    useState<AdminConversationData | null>(null);
  const [conversationToBlock, setConversationToBlock] =
    useState<AdminConversationData | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const { data: conversationsData, isLoading, error } = useQuery({
    queryKey: ["admin-conversations", page, search, statusFilter],
    queryFn: () =>
      adminMessagingService.getAllConversations({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter === ALL_STATUSES ? undefined : statusFilter,
      }),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminMessagingService.blockConversation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      toast({ title: "Conversa bloqueada com sucesso" });
      setConversationToBlock(null);
      setBlockReason("");
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao bloquear conversa",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao bloquear conversa",
        variant: "destructive",
      });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => adminMessagingService.unblockConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      toast({ title: "Conversa desbloqueada com sucesso" });
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao desbloquear conversa",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao desbloquear conversa",
        variant: "destructive",
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => adminMessagingService.closeConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      toast({ title: "Conversa encerrada com sucesso" });
      setSelectedConversation(null);
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao encerrar conversa",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao encerrar conversa",
        variant: "destructive",
      });
    },
  });

  if (!isChecking && !canModerate) {
    return <AdminAccessDenied />;
  }

  const handleClose = async (conversation: AdminConversationData) => {
    const confirmed = await confirm({
      title: "Encerrar conversa",
      description: `A conversa ${conversation.id} será encerrada e preservada para auditoria.`,
      confirmLabel: "Encerrar",
      variant: "destructive",
    });
    if (!confirmed) return;
    closeMutation.mutate(conversation.id);
  };

  const handleConfirmBlock = () => {
    const reason = blockReason.trim();
    if (!conversationToBlock || !reason) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo antes de bloquear a conversa.",
        variant: "destructive",
      });
      return;
    }

    blockMutation.mutate({ id: conversationToBlock.id, reason });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Conversas</h1>
          <p className="text-muted-foreground">
            Modere conversas entre compradores e vendedores.
          </p>
        </div>

        <Card className="mb-6 border-border bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px] flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Buscar conversas..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    className="border-input bg-background pl-10 text-foreground"
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] border-input bg-background text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value={ALL_STATUSES}>Todos os status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card text-card-foreground">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground" role="status">
                Carregando...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive" role="alert">
                Erro ao carregar conversas
              </div>
            ) : !conversationsData?.data || conversationsData.data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma conversa encontrada
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">ID</TableHead>
                      <TableHead className="text-muted-foreground">Comprador</TableHead>
                      <TableHead className="text-muted-foreground">Vendedor</TableHead>
                      <TableHead className="text-muted-foreground">Classificado</TableHead>
                      <TableHead className="text-muted-foreground">Mensagens</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Criado em</TableHead>
                      <TableHead className="text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversationsData.data.map((conversation) => (
                      <TableRow key={conversation.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {conversation.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <ParticipantCell
                            avatar={conversation.buyer_avatar}
                            name={conversation.buyer_name}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <ParticipantCell
                            avatar={conversation.seller_avatar}
                            name={conversation.seller_name}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {conversation.classified_title || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" aria-hidden="true" />
                            {conversation.message_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              conversation.status === "blocked"
                                ? "destructive"
                                : conversation.status === "active"
                                  ? "default"
                                  : "secondary"
                            }
                            className={
                              conversation.status === "active"
                                ? "bg-success text-success-foreground hover:bg-success/90"
                                : undefined
                            }
                          >
                            {statusLabel(conversation.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(conversation.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedConversation(conversation)}
                              aria-label={`Ver conversa ${conversation.id}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            {conversation.status === "active" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConversationToBlock(conversation)}
                                disabled={blockMutation.isPending}
                                aria-label={`Bloquear conversa ${conversation.id}`}
                              >
                                <ShieldAlert
                                  className="h-4 w-4 text-destructive"
                                  aria-hidden="true"
                                />
                              </Button>
                            ) : conversation.status === "blocked" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => unblockMutation.mutate(conversation.id)}
                                disabled={unblockMutation.isPending}
                                aria-label={`Desbloquear conversa ${conversation.id}`}
                              >
                                <ShieldAlert
                                  className="h-4 w-4 text-success"
                                  aria-hidden="true"
                                />
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleClose(conversation)}
                              disabled={closeMutation.isPending}
                              aria-label={`Encerrar conversa ${conversation.id}`}
                            >
                              <CircleStop
                                className="h-4 w-4 text-destructive"
                                aria-hidden="true"
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t border-border p-4">
                  <div className="text-sm text-muted-foreground">
                    Página {conversationsData.page} de {conversationsData.totalPages} • Total:{" "}
                    {conversationsData.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPage((currentPage) =>
                          Math.min(conversationsData.totalPages, currentPage + 1),
                        )
                      }
                      disabled={page === conversationsData.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(selectedConversation)}
          onOpenChange={(open) => {
            if (!open) setSelectedConversation(null);
          }}
        >
          <DialogContent className="max-w-2xl border-border bg-popover text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Detalhes da conversa</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Informações completas da conversa
              </DialogDescription>
            </DialogHeader>
            {selectedConversation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ConversationDetail label="ID" value={selectedConversation.id} mono />
                  <ConversationDetail
                    label="Status"
                    value={statusLabel(selectedConversation.status)}
                  />
                  <ConversationDetail
                    label="Comprador"
                    value={selectedConversation.buyer_name || "-"}
                  />
                  <ConversationDetail
                    label="Vendedor"
                    value={selectedConversation.seller_name || "-"}
                  />
                  <ConversationDetail
                    label="Classificado"
                    value={selectedConversation.classified_title || "-"}
                  />
                  <ConversationDetail
                    label="Mensagens"
                    value={String(selectedConversation.message_count || 0)}
                  />
                  <ConversationDetail
                    label="Criado em"
                    value={formatDate(selectedConversation.created_at)}
                  />
                  {selectedConversation.blocked_by ? (
                    <ConversationDetail
                      label="Bloqueado por"
                      value={selectedConversation.blocked_by}
                    />
                  ) : null}
                </div>
                {selectedConversation.block_reason ? (
                  <ConversationDetail
                    label="Motivo do bloqueio"
                    value={selectedConversation.block_reason}
                  />
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(conversationToBlock)}
          onOpenChange={(open) => {
            if (!open) {
              setConversationToBlock(null);
              setBlockReason("");
            }
          }}
        >
          <DialogContent className="border-border bg-popover text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Bloquear conversa</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Registre o motivo administrativo para auditoria.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="Descreva o motivo do bloqueio..."
              className="min-h-[120px] border-input bg-background text-foreground"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConversationToBlock(null);
                  setBlockReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmBlock}
                disabled={blockMutation.isPending}
              >
                {blockMutation.isPending ? "Bloqueando..." : "Bloquear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ConfirmDialog />
      </div>
    </div>
  );
}

function ParticipantCell({ avatar, name }: { avatar?: string | null; name?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : null}
      {name || "-"}
    </div>
  );
}

function ConversationDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={mono ? "break-all font-mono text-foreground" : "text-foreground"}>
        {value}
      </p>
    </div>
  );
}
