import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToggleRight, Shield, Search, Filter, Trash2, Eye } from "lucide-react";
import { ALERT_STATUS } from "@/shared/types/constants";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { adminClassifiedsService } from "@/core/admin";
import type { AdminClassifiedData } from "@/core/admin";
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
  CardDescription,
  CardHeader,
  CardTitle,
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

const CATEGORY_OPTIONS = [
  "móveis",
  "eletrônicos",
  "veículos",
  "roupas",
  "serviços",
  "outros",
];

const STATUS_OPTIONS = [ALERT_STATUS.ACTIVE, "sold", "inactive", "pending", "rejected"];

export default function AdminClassificados() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedClassified, setSelectedClassified] = useState<AdminClassifiedData | null>(null);

  // Busca classificados usando AdminClassifiedsService
  const { data: classifiedsData, isLoading, error } = useQuery({
    queryKey: ["admin-classifieds", page, search, statusFilter, categoryFilter],
    queryFn: () =>
      adminClassifiedsService.getAllClassifieds({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminClassifiedsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classifieds"] });
      toast({ title: "Status atualizado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    },
  });

  // Delete classified
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClassifiedsService.deleteClassified(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classifieds"] });
      toast({ title: "Classificado excluído com sucesso" });
      setSelectedClassified(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir classificado", description: error.message, variant: "destructive" });
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

  const handleToggleActive = (classified: AdminClassifiedData) => {
    const newStatus = classified.status === ALERT_STATUS.ACTIVE ? "inactive" : ALERT_STATUS.ACTIVE;
    toggleActiveMutation.mutate({ id: classified.id, isActive: newStatus === ALERT_STATUS.ACTIVE });
  };

  const handleDelete = (classified: AdminClassifiedData) => {
    if (confirm(`Tem certeza que deseja excluir o classificado "${classified.title}"?`)) {
      deleteMutation.mutate(classified.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F14] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Classificados</h1>
          <p className="text-gray-400">
            Gerencie anúncios e classificados da comunidade
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
                    placeholder="Buscar classificados..."
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
                Erro ao carregar classificados
              </div>
            ) : !classifiedsData?.data || classifiedsData.data.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhum classificado encontrado
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Título</TableHead>
                      <TableHead className="text-gray-300">Categoria</TableHead>
                      <TableHead className="text-gray-300">Preço</TableHead>
                      <TableHead className="text-gray-300">Vendedor</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classifiedsData.data.map((classified) => (
                      <TableRow key={classified.id} className="border-gray-700">
                        <TableCell className="text-white font-medium">
                          {classified.title}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {classified.category}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {classified.price ? `R$ ${classified.price}` : "-"}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {classified.seller_name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              classified.status === ALERT_STATUS.ACTIVE
                                ? "default"
                                : "secondary"
                            }
                          >
                            {classified.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedClassified(classified)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(classified)}
                              disabled={toggleActiveMutation.isPending}
                            >
                              <ToggleRight className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(classified)}
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
                    Página {classifiedsData.page} de {classifiedsData.totalPages} • Total: {classifiedsData.total}
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
                      onClick={() => setPage((p) => Math.min(classifiedsData.totalPages, p + 1))}
                      disabled={page === classifiedsData.totalPages}
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
        <Dialog open={!!selectedClassified} onOpenChange={() => setSelectedClassified(null)}>
          <DialogContent className="bg-[#121922] border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Classificado</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas do anúncio
              </DialogDescription>
            </DialogHeader>
            {selectedClassified && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Título</label>
                  <p className="text-white">{selectedClassified.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Descrição</label>
                  <p className="text-white whitespace-pre-wrap">
                    {selectedClassified.description || "Sem descrição"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Preço</label>
                    <p className="text-white">
                      {selectedClassified.price ? `R$ ${selectedClassified.price}` : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Categoria</label>
                    <p className="text-white">{selectedClassified.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <p className="text-white">{selectedClassified.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Vendedor</label>
                    <p className="text-white">{selectedClassified.seller_name || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
