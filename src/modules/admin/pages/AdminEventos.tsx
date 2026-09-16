import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Search, ToggleRight, Trash2, Users } from "lucide-react";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
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
import { Card, CardContent } from "@/shared/components/ui/card";
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
import { cn } from "@/shared/utils/cn";

const CATEGORY_OPTIONS = ["show", "feira", "festa", "esportivo", "educação", "promoção"] as const;
const STATUS_OPTIONS = ["upcoming", "ongoing", "completed", "cancelled"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  upcoming: "Próximo",
  ongoing: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

function getStatusBadgeClass(status: AdminEventData["status"]): string {
  if (status === "ongoing") return "bg-info text-info-foreground hover:bg-info/90";
  if (status === "completed") return "bg-success text-success-foreground hover:bg-success/90";
  if (status === "cancelled") return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return "bg-primary text-primary-foreground hover:bg-primary/90";
}

export default function AdminEventos() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<AdminEventData | null>(null);

  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ["admin-events", page, search, statusFilter, categoryFilter],
    queryFn: () =>
      adminEventsService.getAllEvents({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminEventsService.cancelEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Evento cancelado com sucesso" });
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao cancelar evento",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao cancelar evento",
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => adminEventsService.markAsCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Evento marcado como concluído" });
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao atualizar evento",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao atualizar evento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminEventsService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Evento excluído com sucesso" });
      setSelectedEvent(null);
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao excluir evento",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao excluir evento",
        variant: "destructive",
      });
    },
  });

  if (!isChecking && !canModerate) {
    return <AdminAccessDenied />;
  }

  const handleDelete = async (event: AdminEventData) => {
    const confirmed = await confirm({
      title: "Excluir evento",
      description: `O evento "${event.title}" será removido do backoffice.`,
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!confirmed) return;
    deleteMutation.mutate(event.id);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground">Gerencie eventos e atividades locais.</p>
        </div>

        <Card className="mb-6 border-border bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px] flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Buscar eventos..."
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
                value={statusFilter || "all"}
                onValueChange={(value) => {
                  setStatusFilter(value === "all" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] border-input bg-background text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) => {
                  setCategoryFilter(value === "all" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] border-input bg-background text-foreground">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value="all">Todas as categorias</SelectItem>
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

        <Card className="border-border bg-card text-card-foreground">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground" role="status">
                Carregando...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive" role="alert">
                Erro ao carregar eventos
              </div>
            ) : !eventsData?.data || eventsData.data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum evento encontrado
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Título</TableHead>
                      <TableHead className="text-muted-foreground">Categoria</TableHead>
                      <TableHead className="text-muted-foreground">Data</TableHead>
                      <TableHead className="text-muted-foreground">Local</TableHead>
                      <TableHead className="text-muted-foreground">Participantes</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsData.data.map((event) => (
                      <TableRow key={event.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {event.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {event.category}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(event.date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {event.location}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" aria-hidden="true" />
                            {event.current_participants}
                            {event.max_participants ? ` / ${event.max_participants}` : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(getStatusBadgeClass(event.status))}>
                            {STATUS_LABELS[event.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEvent(event)}
                              aria-label={`Ver evento ${event.title}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            {event.status === "upcoming" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelMutation.mutate(event.id)}
                                disabled={cancelMutation.isPending}
                                aria-label={`Cancelar evento ${event.title}`}
                              >
                                <ToggleRight className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            ) : null}
                            {event.status === "ongoing" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => completeMutation.mutate(event.id)}
                                disabled={completeMutation.isPending}
                                aria-label={`Concluir evento ${event.title}`}
                              >
                                <ToggleRight className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleDelete(event)}
                              disabled={deleteMutation.isPending}
                              aria-label={`Excluir evento ${event.title}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t border-border p-4">
                  <div className="text-sm text-muted-foreground">
                    Página {eventsData.page} de {eventsData.totalPages} • Total: {eventsData.total}
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
                          Math.min(eventsData.totalPages, currentPage + 1),
                        )
                      }
                      disabled={page === eventsData.totalPages}
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
          open={Boolean(selectedEvent)}
          onOpenChange={(open) => {
            if (!open) setSelectedEvent(null);
          }}
        >
          <DialogContent className="max-w-2xl border-border bg-popover text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Detalhes do evento</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Informações completas do evento
              </DialogDescription>
            </DialogHeader>
            {selectedEvent ? (
              <div className="space-y-4">
                <EventDetail label="Título" value={selectedEvent.title} />
                <EventDetail
                  label="Descrição"
                  value={selectedEvent.description || "Sem descrição"}
                  multiline
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EventDetail label="Data" value={formatDate(selectedEvent.date)} />
                  <EventDetail label="Local" value={selectedEvent.location} />
                  <EventDetail label="Categoria" value={selectedEvent.category} />
                  <EventDetail label="Status" value={STATUS_LABELS[selectedEvent.status]} />
                  <EventDetail
                    label="Participantes"
                    value={`${selectedEvent.current_participants}${selectedEvent.max_participants ? ` / ${selectedEvent.max_participants}` : ""}`}
                  />
                  <EventDetail
                    label="Organizador"
                    value={selectedEvent.organizer_name || "-"}
                  />
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
        <ConfirmDialog />
      </div>
    </div>
  );
}

function EventDetail({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={multiline ? "whitespace-pre-wrap text-foreground" : "text-foreground"}>
        {value}
      </p>
    </div>
  );
}
