/* eslint-disable react-hooks/exhaustive-deps */
 
import React from "react";

import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import {
  Check,
  X,
  Trash2,
  Eye,
  Star,
  Search,
  Filter,
  MessageSquare,
  Shield,
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { adminCommunityService } from "@/core/admin/services/AdminCommunityService";
import { profileService } from "@/core/profiles/services/ProfileService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";

interface Professional {
  id: string;
  profile_id?: string;
  name: string;
  photo: string;
  service: string;
  category: string;
  neighborhood: string;
  whatsapp: string;
  rating: number;
  total_avaliacoes: number;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  professional_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: { name: string; avatar_url: string } | null;
  professional: { name: string } | null;
}

interface Report {
  id: string;
  professional_id: string;
  motivo: string;
  detalhes: string;
  status: string;
  created_at: string;
  professional: { name: string } | null;
}

type ProfessionalSimple = { id: string; name?: string | null };
type ReviewRecord = {
  reviewer_profile_id: string;
  reviewed_profile_id: string;
} & Record<string, unknown>;

export default function AdminServicos() {
  const { canModerate, isChecking } = useAdminGuard();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
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
      // Load professionals via AdminCommunityService
      const pros = await adminCommunityService.getAllProfessionals();
      setProfessionals((pros as Professional[]) || []);

      // Load reviews via ReviewsService (SSOT)
      const revs = await ReviewsService.getAllReviews("professional", 100);

      if (revs.length > 0) {
        const reviewerIds = [...new Set(revs.map((r) => r.reviewer_profile_id))];
        const proIds = [...new Set(revs.map((r) => r.reviewed_profile_id))];

        const profiles =
          reviewerIds.length > 0
            ? await profileService.getProfilesSummary(reviewerIds as string[])
            : [];
        const prosData =
          proIds.length > 0
            ? await ProfessionalService.getProfessionalsByIdsSimple(
                proIds as string[],
              )
            : [];

        const profileMap = new Map(
          profiles.map((p) => [p.id, { name: p.name, avatar_url: p.avatarUrl }]),
        );
        const proMap = new Map(
          (prosData || []).map((p: ProfessionalSimple) => [p.id, p] as const),
        );

        setReviews(
          revs.map((r: ReviewRecord) => ({
            ...r,
            reviewer: profileMap.get(r.reviewer_profile_id) || {
              name: "Usuário",
              avatar_url: "",
            },
            professional: proMap.get(r.reviewed_profile_id) || {
              name: "Desconhecido",
            },
          })) as Review[],
        );
      } else {
        setReviews([]);
      }

      // Load reports via AdminCommunityService
      const reps = await adminCommunityService.getProfessionalReports();

      if (reps && reps.length > 0) {
        const proIds = [...new Set(reps.map((r) => r.professional_id))];
        const prosData =
          proIds.length > 0
            ? await ProfessionalService.getProfessionalsByIdsSimple(
                proIds as string[],
              )
            : [];
        const proMap = new Map(
          (prosData || []).map((p: ProfessionalSimple) => [p.id, p] as const),
        );

        setReports(
          reps.map((r) => ({
            ...r,
            professional: proMap.get(r.professional_id) || null,
          })),
        );
      } else {
        setReports([]);
      }
    } catch (error) {
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
    if (!isChecking && canModerate) {
      loadData();
    }
  }, [canModerate, isChecking]);

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

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      await ProfessionalService.updateProfessionalStatus(id, status);
      toast({
        title:
          status === "aprovado"
            ? "Profissional aprovado!"
            : "Profissional rejeitado",
      });
      await loadData();
    } catch {
      toast({
        title: "Erro ao atualizar status",
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

  const resolveReport = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      await ProfessionalService.updateProfessionalReport(id, status);
      toast({ title: "Denúncia resolvida" });
      await loadData();
    } catch {
      toast({
        title: "Erro ao atualizar denúncia",
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

  const filteredPros = professionals.filter((p) => {
    if (filterStatus !== "todos" && p.status !== filterStatus) return false;
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.service.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const pendingCount = professionals.filter(
    (p) => p.status === "pendente",
  ).length;
  const pendingReports = reports.filter((r) => r.status === "pendente").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Serviços</h1>
        <p className="text-muted-foreground">
          Gerencie prestadores de serviço e avaliações
        </p>
      </div>

      <Tabs defaultValue="professionals">
        <TabsList>
          <TabsTrigger value="professionals" className="gap-1">
            Profissionais
            {pendingCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1">
            Denúncias
            {pendingReports > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5">
                {pendingReports}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professionals" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Profissional</th>
                  <th className="text-left p-3">Serviço</th>
                  <th className="text-left p-3">Bairro</th>
                  <th className="text-center p-3">Avaliação</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Carregando serviços...
                    </td>
                  </tr>
                ) : filteredPros.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Nenhum resultado
                    </td>
                  </tr>
                ) : (
                  filteredPros.map((pro) => (
                    <tr key={pro.id} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={pro.photo} />
                            <AvatarFallback>{(pro.name ?? '?')[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{pro.name ?? 'Nome não informado'}</span>
                        </div>
                      </td>
                      <td className="p-3">{pro.service ?? 'N/A'}</td>
                      <td className="p-3">{pro.neighborhood ?? 'N/A'}</td>
                      <td className="p-3 text-center">
                        <span className="flex items-center justify-center gap-0.5">
                          <Star className="h-3 w-3 text-warning fill-warning" />
                          {Number(pro.rating).toFixed(1)} (
                          {pro.total_avaliacoes})
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            pro.status === "aprovado"
                              ? "default"
                              : pro.status === "pendente"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {pro.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={actionLoading}
                            onClick={() => setSelectedPro(pro)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {pro.status === "pendente" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-success"
                                disabled={actionLoading}
                                onClick={() => updateStatus(pro.id, "aprovado")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                disabled={actionLoading}
                                onClick={() =>
                                  updateStatus(pro.id, "rejeitado")
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            disabled={actionLoading}
                            onClick={() => {
                              setDeleteTarget({
                                type: "professional",
                                id: pro.profile_id || pro.id,
                              });
                              setShowDeleteDialog(true);
                            }}
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
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Avaliador</th>
                  <th className="text-left p-3">Profissional</th>
                  <th className="text-center p-3">Nota</th>
                  <th className="text-left p-3">Comentário</th>
                  <th className="text-left p-3">Data</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Nenhuma avaliação
                    </td>
                  </tr>
                ) : (
                  reviews.map((rev) => (
                    <tr key={rev.id} className="border-t">
                      <td className="p-3">{rev.reviewer?.name || "Anônimo"}</td>
                      <td className="p-3">{rev.professional?.name || "-"}</td>
                      <td className="p-3 text-center">
                        <span className="flex items-center justify-center gap-0.5">
                          {rev.rating}{" "}
                          <Star className="h-3 w-3 text-warning fill-warning" />
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate">
                        {rev.comment || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDistanceToNow(new Date(rev.created_at), {
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
                            setDeleteTarget({ type: "review", id: rev.id });
                            setShowDeleteDialog(true);
                          }}
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

        <TabsContent value="reports" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Profissional</th>
                  <th className="text-left p-3">Motivo</th>
                  <th className="text-left p-3">Detalhes</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Nenhuma denúncia
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr key={rep.id} className="border-t">
                      <td className="p-3">{rep.professional?.name || "-"}</td>
                      <td className="p-3">{rep.motivo}</td>
                      <td className="p-3 max-w-xs truncate">
                        {rep.detalhes || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            rep.status === "pendente" ? "secondary" : "default"
                          }
                        >
                          {rep.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {rep.status === "pendente" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading}
                              onClick={() => resolveReport(rep.id, "resolvido")}
                            >
                              Resolver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoading}
                              onClick={() => resolveReport(rep.id, "ignorado")}
                            >
                              Ignorar
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* View professional dialog */}
      <Dialog open={!!selectedPro} onOpenChange={() => setSelectedPro(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Profissional</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Gerenciar serviços profissionais
          </DialogDescription>
          {selectedPro && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPro.photo} />
                  <AvatarFallback>{(selectedPro.name ?? '?')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{selectedPro.name ?? 'Nome não informado'}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPro.service ?? 'N/A'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Categoria:</span>{" "}
                  {selectedPro.category ?? 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Bairro:</span>{" "}
                  {selectedPro.neighborhood ?? 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">WhatsApp:</span>{" "}
                  {selectedPro.whatsapp || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Avaliação:</span>{" "}
                  {Number(selectedPro.rating ?? 0).toFixed(1)} (
                  {selectedPro.total_avaliacoes ?? 0})
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
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
            <Button variant="destructive" disabled={actionLoading} onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

