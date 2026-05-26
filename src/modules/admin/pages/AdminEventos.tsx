import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToggleRight, Shield, Search, Trash2, Eye, Users } from "lucide-react";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { adminEventsService } from "@/core/admin";
import type { AdminEventData } from "@/core/admin";
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
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { toast } from "@/shared/components/ui/use-toast";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";

const CATEGORY_OPTIONS = ["show", "feira", "festa", "esportivo", "educação", "promoção"];
const STATUS_OPTIONS = ["upcoming", "ongoing", "completed", "cancelled"];

export default function AdminEventos() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<AdminEventData | null>(null);

  // Busca eventos usando AdminEventsService
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ["admin-events", page, search, statusFilter, categoryFilter],
    queryFn: () =>
      adminEventsService.getAllEvents({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Cancel event
  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminEventsService.cancelEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Evento cancelado com sucesso" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao cancelar evento",
        description: error instanceof Error ? error.message : "Falha ao cancelar evento",
        variant: "destructive",
      });
    },
  });

  // Mark as completed
  const completeMutation = useMutation({
    mutationFn: (id: string) => adminEventsService.markAsCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Evento marcado como concluído" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao atualizar evento",
        description: error instanceof Error ? error.message : "Falha ao atualizar evento",
        variant: "destructive",
      });
    },
  });

  // Delete event
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminEventsService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Evento excluído com sucesso" });
      setSelectedEvent(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao excluir evento",
        description: error instanceof Error ? error.message : "Falha ao excluir evento",
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

  const handleDelete = async (event: AdminEventData) => {
    const confirmed = await confirm({
      title: "Excluir evento",
      description: `O evento "${event.title}" sera removido do backoffice.`,
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!confirmed) return;
    deleteMutation.mutate(event.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#0A0F14] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Eventos</h1>
          <p className="text-gray-400">
            Gerencie eventos e atividades locais
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
                    placeholder="Buscar eventos..."
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] bg-[#0A0F14] border-gray-700 text-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#121922] border-gray-700">
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
                Erro ao carregar eventos
              </div>
            ) : !eventsData?.data || eventsData.data.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhum evento encontrado
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Título</TableHead>
                      <TableHead className="text-gray-300">Categoria</TableHead>
                      <TableHead className="text-gray-300">Data</TableHead>
                      <TableHead className="text-gray-300">Local</TableHead>
                      <TableHead className="text-gray-300">Participantes</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsData.data.map((event) => (
                      <TableRow key={event.id} className="border-gray-700">
                        <TableCell className="text-white font-medium">
                          {event.title}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {event.category}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(event.date)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {event.location}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.current_participants}
                            {event.max_participants && ` / ${event.max_participants}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              event.status === "upcoming"
                                ? "default"
                                : event.status === "ongoing"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {event.status === "upcoming" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelMutation.mutate(event.id)}
                                disabled={cancelMutation.isPending}
                              >
                                <ToggleRight className="h-4 w-4" />
                              </Button>
                            )}
                            {event.status === "ongoing" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => completeMutation.mutate(event.id)}
                                disabled={completeMutation.isPending}
                              >
                                <ToggleRight className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(event)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
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
                    Página {eventsData.page} de {eventsData.totalPages} • Total: {eventsData.total}
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
                      onClick={() => setPage((p) => Math.min(eventsData.totalPages, p + 1))}
                      disabled={page === eventsData.totalPages}
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
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="bg-[#121922] border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Evento</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas do evento
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Título</label>
                  <p className="text-white">{selectedEvent.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Descrição</label>
                  <p className="text-white whitespace-pre-wrap">
                    {selectedEvent.description || "Sem descrição"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Data</label>
                    <p className="text-white">{formatDate(selectedEvent.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Local</label>
                    <p className="text-white">{selectedEvent.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Categoria</label>
                    <p className="text-white">{selectedEvent.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <p className="text-white">{selectedEvent.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Participantes</label>
                    <p className="text-white">
                      {selectedEvent.current_participants}
                      {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Organizador</label>
                    <p className="text-white">{selectedEvent.organizer_name || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <ConfirmDialog />
      </div>
    </div>
  );
}
