import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Shield, Search, CircleStop, Eye, MessageSquare, User } from "lucide-react";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { adminMessagingService } from "@/core/admin";
import type { AdminConversationData } from "@/core/admin";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "@/shared/components/ui/use-toast";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";

const STATUS_OPTIONS = ["active", "blocked"];

export default function AdminMensagens() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedConversation, setSelectedConversation] = useState<AdminConversationData | null>(null);
  const [conversationToBlock, setConversationToBlock] = useState<AdminConversationData | null>(null);
  const [blockReason, setBlockReason] = useState("");

  // Busca conversas usando AdminMessagingService
  const { data: conversationsData, isLoading, error } = useQuery({
    queryKey: ["admin-conversations", page, search, statusFilter],
    queryFn: () =>
      adminMessagingService.getAllConversations({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Block conversation
  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminMessagingService.blockConversation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      toast({ title: "Conversa bloqueada com sucesso" });
      setConversationToBlock(null);
      setBlockReason("");
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao bloquear conversa",
        description: error instanceof Error ? error.message : "Falha ao bloquear conversa",
        variant: "destructive",
      });
    },
  });

  // Unblock conversation
  const unblockMutation = useMutation({
    mutationFn: (id: string) => adminMessagingService.unblockConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      toast({ title: "Conversa desbloqueada com sucesso" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao desbloquear conversa",
        description: error instanceof Error ? error.message : "Falha ao desbloquear conversa",
        variant: "destructive",
      });
    },
  });

  // Close without destroying the moderation and audit trail.
  const closeMutation = useMutation({
    mutationFn: (id: string) => adminMessagingService.closeConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      toast({ title: "Conversa encerrada com sucesso" });
      setSelectedConversation(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao encerrar conversa",
        description: error instanceof Error ? error.message : "Falha ao encerrar conversa",
        variant: "destructive",
      });
    },
  });

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

  const handleClose = async (conversation: AdminConversationData) => {
    const confirmed = await confirm({
      title: "Encerrar conversa",
      description: `A conversa ${conversation.id} sera encerrada e preservada para auditoria.`,
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
        title: "Motivo obrigatorio",
        description: "Informe o motivo antes de bloquear a conversa.",
        variant: "destructive",
      });
      return;
    }

    blockMutation.mutate({ id: conversationToBlock.id, reason });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#0A0F14] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Conversas</h1>
          <p className="text-gray-400">
            Modere conversas entre compradores e vendedores
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-[#121922] border-gray-800 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-[#0A0F14] border-gray-700 text-white"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-[#0A0F14] border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#121922] border-gray-700">
                  <SelectItem value="">Todos os status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-[#121922] border-gray-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                Erro ao carregar conversas
              </div>
            ) : !conversationsData?.data || conversationsData.data.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhuma conversa encontrada
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">ID</TableHead>
                      <TableHead className="text-gray-300">Comprador</TableHead>
                      <TableHead className="text-gray-300">Vendedor</TableHead>
                      <TableHead className="text-gray-300">Classificado</TableHead>
                      <TableHead className="text-gray-300">Mensagens</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Criado em</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversationsData.data.map((conversation) => (
                      <TableRow key={conversation.id} className="border-gray-700">
                        <TableCell className="text-white font-medium">
                          {conversation.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            {conversation.buyer_avatar && (
                              <img
                                src={conversation.buyer_avatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            {conversation.buyer_name || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            {conversation.seller_avatar && (
                              <img
                                src={conversation.seller_avatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            {conversation.seller_name || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {conversation.classified_title || "-"}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {conversation.message_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              conversation.status === "active"
                                ? "default"
                                : conversation.status === "blocked"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {conversation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(conversation.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedConversation(conversation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {conversation.status === "active" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConversationToBlock(conversation)}
                                disabled={blockMutation.isPending}
                              >
                                <ShieldAlert className="h-4 w-4 text-red-400" />
                              </Button>
                            ) : conversation.status === "blocked" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => unblockMutation.mutate(conversation.id)}
                                disabled={unblockMutation.isPending}
                              >
                                <ShieldAlert className="h-4 w-4 text-green-400" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleClose(conversation)}
                              disabled={closeMutation.isPending}
                            >
                              <CircleStop className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="p-4 flex items-center justify-between border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Página {conversationsData.page} de {conversationsData.totalPages} • Total: {conversationsData.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-gray-700 text-white"
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(conversationsData.totalPages, p + 1))}
                      disabled={page === conversationsData.totalPages}
                      className="border-gray-700 text-white"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="bg-[#121922] border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Conversa</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas da conversa
              </DialogDescription>
            </DialogHeader>
            {selectedConversation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">ID</label>
                    <p className="text-white font-mono">{selectedConversation.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <p className="text-white">{selectedConversation.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Comprador</label>
                    <p className="text-white">{selectedConversation.buyer_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Vendedor</label>
                    <p className="text-white">{selectedConversation.seller_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Classificado</label>
                    <p className="text-white">{selectedConversation.classified_title || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Mensagens</label>
                    <p className="text-white">{selectedConversation.message_count || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Criado em</label>
                    <p className="text-white">{formatDate(selectedConversation.created_at)}</p>
                  </div>
                  {selectedConversation.blocked_by && (
                    <div>
                      <label className="text-sm font-medium text-gray-300">Bloqueado por</label>
                      <p className="text-white">{selectedConversation.blocked_by}</p>
                    </div>
                  )}
                </div>
                {selectedConversation.block_reason && (
                  <div>
                    <label className="text-sm font-medium text-gray-300">Motivo do Bloqueio</label>
                    <p className="text-white">{selectedConversation.block_reason}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!conversationToBlock}
          onOpenChange={(open) => {
            if (!open) {
              setConversationToBlock(null);
              setBlockReason("");
            }
          }}
        >
          <DialogContent className="bg-[#121922] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Bloquear conversa</DialogTitle>
              <DialogDescription className="text-gray-400">
                Registre o motivo administrativo para auditoria.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="Descreva o motivo do bloqueio..."
              className="min-h-[120px] bg-[#0A0F14] border-gray-700 text-white"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConversationToBlock(null);
                  setBlockReason("");
                }}
                className="border-gray-700 text-white"
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmBlock} disabled={blockMutation.isPending}>
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
