import { useEffect, useState } from "react";
import {
  Eye,
  Filter,
  PauseCircle,
  PlayCircle,
  Search,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/shared/hooks/use-toast";
import { ptBR } from "@/shared/utils/dateLocale";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { adminCommunityService } from "@/core/admin/services/AdminCommunityService";
import { profileService } from "@/core/profiles/services/ProfileService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import type {
  Professional,
  ProfessionalStatus,
} from "@/core/professional/types";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { name: string; avatar_url: string } | null;
  professional: { name: string } | null;
}

type ProfessionalSimple = { id: string; name: string };
type AvailabilityFilter = "all" | "active" | "inactive";
type AvailabilityStatus = Extract<ProfessionalStatus, "active" | "inactive">;

function availabilityLabel(status: ProfessionalStatus): string {
  if (status === "active") return "Ativo";
  if (status === "inactive") return "Pausado";
  if (status === "suspended") return "Suspenso";
  return "Pendente";
}

export default function AdminServicos() {
  const { canModerate, isChecking } = useAdminGuard();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AvailabilityFilter>("all");
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "professional" | "review";
    id: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const pros = await adminCommunityService.getAllProfessionals();
      setProfessionals(pros ?? []);

      const revs = await ReviewsService.getAllReviews("professional", 100);
      if (revs.length === 0) {
        setReviews([]);
        return;
      }

      const reviewerIds = [...new Set(revs.map((review) => review.reviewer_profile_id))];
      const professionalProfileIds = [
        ...new Set(revs.map((review) => review.reviewed_profile_id)),
      ];

      const profiles =
        reviewerIds.length > 0
          ? await profileService.getProfilesSummary(reviewerIds)
          : [];
      const professionalData =
        professionalProfileIds.length > 0
          ? await ProfessionalService.getProfessionalsByIdsSimple(
              professionalProfileIds,
            )
          : [];

      const profileMap = new Map(
        profiles.map((profile) => [
          profile.id,
          { name: profile.displayName, avatar_url: profile.avatarUrl },
        ]),
      );
      const professionalMap = new Map(
        professionalData.map((professional: ProfessionalSimple) => [
          professional.id,
          professional,
        ] as const),
      );

      setReviews(
        revs.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          reviewer: profileMap.get(review.reviewer_profile_id) ?? {
            name: "Usuário",
            avatar_url: "",
          },
          professional: professionalMap.get(review.reviewed_profile_id) ?? {
            name: "Desconhecido",
          },
        })),
      );
    } catch {
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar os dados de moderação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isChecking && canModerate) void loadData();
    // loadData is intentionally tied to the authorization gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canModerate, isChecking]);

  if (!isChecking && !canModerate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F14] p-4">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  const updateAvailability = async (
    professionalId: string,
    status: AvailabilityStatus,
  ) => {
    setActionLoading(true);
    try {
      await ProfessionalService.updateProfessionalStatus(professionalId, status);
      toast({
        title:
          status === "active"
            ? "Profissional ativado"
            : "Disponibilidade pausada",
      });
      await loadData();
    } catch {
      toast({
        title: "Erro ao atualizar disponibilidade",
        description: "Não foi possível concluir esta ação.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProfessional = async (id: string) => {
    setActionLoading(true);
    try {
      await ProfessionalService.deleteProfessional(id);
      toast({ title: "Profissional removido" });
      await loadData();
    } catch {
      toast({
        title: "Erro ao remover profissional",
        description: "Não foi possível concluir esta ação.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteReview = async (id: string) => {
    setActionLoading(true);
    try {
      await ProfessionalService.deleteProfessionalReview(id);
      toast({ title: "Avaliação removida" });
      await loadData();
    } catch {
      toast({
        title: "Erro ao remover avaliação",
        description: "Não foi possível concluir esta ação.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "professional") {
      await deleteProfessional(deleteTarget.id);
    } else {
      await deleteReview(deleteTarget.id);
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const filteredProfessionals = professionals.filter((professional) => {
    if (filterStatus !== "all" && professional.status !== filterStatus) {
      return false;
    }
    if (!normalizedSearch) return true;

    return [professional.name, professional.category, professional.neighborhood]
      .filter((value): value is string => Boolean(value))
      .some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
      );
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Serviços</h1>
        <p className="text-muted-foreground">
          Gerencie disponibilidade, perfis e avaliações de profissionais.
        </p>
      </div>

      <Tabs defaultValue="professionals">
        <TabsList>
          <TabsTrigger value="professionals">Profissionais</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="professionals" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar profissional, categoria ou bairro..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as AvailabilityFilter)}
            >
              <SelectTrigger className="w-40">
                <Filter className="mr-1 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Pausados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Profissional</th>
                  <th className="p-3 text-left">Serviço</th>
                  <th className="p-3 text-left">Bairro</th>
                  <th className="p-3 text-center">Avaliação</th>
                  <th className="p-3 text-center">Disponibilidade</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      Carregando serviços...
                    </td>
                  </tr>
                ) : filteredProfessionals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      Nenhum resultado
                    </td>
                  </tr>
                ) : (
                  filteredProfessionals.map((professional) => (
                    <tr key={professional.id} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={professional.logo_url} />
                            <AvatarFallback>
                              {(professional.name || "P").charAt(0).toLocaleUpperCase("pt-BR")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className="block truncate font-medium">
                              {professional.name || "Nome não informado"}
                            </span>
                            {professional.is_verified ? (
                              <span className="text-xs text-muted-foreground">Verificado</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{professional.category || "N/A"}</td>
                      <td className="p-3">{professional.neighborhood || "N/A"}</td>
                      <td className="p-3 text-center">
                        <span className="flex items-center justify-center gap-0.5">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {Number(professional.rating ?? 0).toFixed(1)} ({professional.total_reviews ?? 0})
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={professional.status === "active" ? "default" : "secondary"}
                        >
                          {availabilityLabel(professional.status)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={actionLoading}
                            onClick={() => setSelectedPro(professional)}
                            aria-label={`Ver ${professional.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {professional.status === "active" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={actionLoading}
                              onClick={() =>
                                void updateAvailability(professional.id, "inactive")
                              }
                              aria-label={`Pausar ${professional.name}`}
                            >
                              <PauseCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-success"
                              disabled={actionLoading}
                              onClick={() =>
                                void updateAvailability(professional.id, "active")
                              }
                              aria-label={`Ativar ${professional.name}`}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            disabled={actionLoading}
                            onClick={() => {
                              setDeleteTarget({
                                type: "professional",
                                id: professional.profile_id || professional.id,
                              });
                              setShowDeleteDialog(true);
                            }}
                            aria-label={`Remover ${professional.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Avaliador</th>
                  <th className="p-3 text-left">Profissional</th>
                  <th className="p-3 text-center">Nota</th>
                  <th className="p-3 text-left">Comentário</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      Nenhuma avaliação
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="border-t">
                      <td className="p-3">{review.reviewer?.name || "Anônimo"}</td>
                      <td className="p-3">{review.professional?.name || "-"}</td>
                      <td className="p-3 text-center">
                        <span className="flex items-center justify-center gap-0.5">
                          {review.rating} <Star className="h-3 w-3 fill-warning text-warning" />
                        </span>
                      </td>
                      <td className="max-w-xs truncate p-3">{review.comment || "-"}</td>
                      <td className="p-3 text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          disabled={actionLoading}
                          onClick={() => {
                            setDeleteTarget({ type: "review", id: review.id });
                            setShowDeleteDialog(true);
                          }}
                          aria-label="Remover avaliação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedPro)} onOpenChange={() => setSelectedPro(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Profissional</DialogTitle>
            <DialogDescription>
              Dados públicos e estado operacional do perfil profissional.
            </DialogDescription>
          </DialogHeader>
          {selectedPro ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPro.logo_url} />
                  <AvatarFallback>
                    {(selectedPro.name || "P").charAt(0).toLocaleUpperCase("pt-BR")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{selectedPro.name || "Nome não informado"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPro.category || "N/A"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Bairro:</span>{" "}
                  {selectedPro.neighborhood || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">WhatsApp:</span>{" "}
                  {selectedPro.whatsapp || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Avaliação:</span>{" "}
                  {Number(selectedPro.rating ?? 0).toFixed(1)} ({selectedPro.total_reviews ?? 0})
                </div>
                <div>
                  <span className="text-muted-foreground">Disponibilidade:</span>{" "}
                  {availabilityLabel(selectedPro.status)}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => void confirmDelete()}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
