import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToggleRight, Shield, Search, Trash2, Eye, Building2 } from "lucide-react";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { adminCouponsService } from "@/core/admin";
import type { CouponData } from "@/core/admin";
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

const TYPE_OPTIONS = ["porcentagem", "valor", "brinde"];

export default function AdminCupons() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null);

  // Busca cupons usando AdminCouponsService
  const { data: couponsData, isLoading, error } = useQuery({
    queryKey: ["admin-coupons", page, search, statusFilter],
    queryFn: () =>
      adminCouponsService.getAllCoupons({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminCouponsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Status atualizado com sucesso" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Falha ao atualizar status",
        variant: "destructive",
      });
    },
  });

  // Delete coupon
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCouponsService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Cupom excluído com sucesso" });
      setSelectedCoupon(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao excluir cupom",
        description: error instanceof Error ? error.message : "Falha ao excluir cupom",
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

  const handleToggleActive = (coupon: CouponData) => {
    toggleActiveMutation.mutate({ id: coupon.id, isActive: !coupon.is_active });
  };

  const handleDelete = (coupon: CouponData) => {
    if (confirm(`Tem certeza que deseja excluir o cupom "${coupon.codigo}"?`)) {
      deleteMutation.mutate(coupon.id);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#0A0F14] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cupons</h1>
          <p className="text-gray-400">
            Gerencie cupons e promoções das empresas
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
                    placeholder="Buscar cupons..."
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
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
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
                Erro ao carregar cupons
              </div>
            ) : !couponsData?.data || couponsData.data.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhum cupom encontrado
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Código</TableHead>
                      <TableHead className="text-gray-300">Empresa</TableHead>
                      <TableHead className="text-gray-300">Desconto</TableHead>
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="text-gray-300">Validade</TableHead>
                      <TableHead className="text-gray-300">Usos</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponsData.data.map((coupon) => (
                      <TableRow key={coupon.id} className="border-gray-700">
                        <TableCell className="text-white font-medium">
                          {coupon.codigo}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            {coupon.business_logo && (
                              <img
                                src={coupon.business_logo}
                                alt=""
                                className="w-6 h-6 rounded object-cover"
                              />
                            )}
                            {coupon.business_name || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {coupon.desconto}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {coupon.tipo_desconto || "-"}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(coupon.validade)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {coupon.usos_count || 0}
                          {coupon.max_usos && ` / ${coupon.max_usos}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={coupon.is_active ? "default" : "secondary"}
                          >
                            {coupon.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedCoupon(coupon)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(coupon)}
                              disabled={toggleActiveMutation.isPending}
                            >
                              <ToggleRight className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(coupon)}
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
                    Página {couponsData.page} de {couponsData.totalPages} • Total: {couponsData.total}
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
                      onClick={() => setPage((p) => Math.min(couponsData.totalPages, p + 1))}
                      disabled={page === couponsData.totalPages}
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
        <Dialog open={!!selectedCoupon} onOpenChange={() => setSelectedCoupon(null)}>
          <DialogContent className="bg-[#121922] border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Cupom</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas do cupom
              </DialogDescription>
            </DialogHeader>
            {selectedCoupon && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Código</label>
                    <p className="text-white">{selectedCoupon.codigo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Empresa</label>
                    <p className="text-white">{selectedCoupon.business_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Desconto</label>
                    <p className="text-white">{selectedCoupon.desconto}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Tipo</label>
                    <p className="text-white">{selectedCoupon.tipo_desconto || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Validade</label>
                    <p className="text-white">{formatDate(selectedCoupon.validade)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Usos</label>
                    <p className="text-white">
                      {selectedCoupon.usos_count || 0}
                      {selectedCoupon.max_usos && ` / ${selectedCoupon.max_usos}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Valor Mínimo</label>
                    <p className="text-white">
                      {selectedCoupon.valor_minimo ? `R$ ${selectedCoupon.valor_minimo}` : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <p className="text-white">{selectedCoupon.is_active ? "Ativo" : "Inativo"}</p>
                  </div>
                </div>
                {selectedCoupon.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-300">Descrição</label>
                    <p className="text-white whitespace-pre-wrap">{selectedCoupon.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
