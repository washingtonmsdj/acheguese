import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Search, Shield, ToggleRight, Trash2 } from "lucide-react";
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

export default function AdminCupons() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null);

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

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminCouponsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Status atualizado com sucesso" });
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao atualizar status",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao atualizar status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCouponsService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Cupom excluído com sucesso" });
      setSelectedCoupon(null);
    },
    onError: (mutationError: unknown) => {
      toast({
        title: "Erro ao excluir cupom",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao excluir cupom",
        variant: "destructive",
      });
    },
  });

  if (!isChecking && !canModerate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-destructive" aria-hidden="true" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">Acesso negado</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  const handleToggleActive = (coupon: CouponData) => {
    toggleActiveMutation.mutate({ id: coupon.id, isActive: !coupon.is_active });
  };

  const handleDelete = async (coupon: CouponData) => {
    const confirmed = await confirm({
      title: "Excluir cupom",
      description: `O cupom "${coupon.codigo}" será removido da área comercial.`,
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!confirmed) return;
    deleteMutation.mutate(coupon.id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Cupons</h1>
          <p className="text-muted-foreground">
            Gerencie cupons e promoções das empresas.
          </p>
        </div>

        <Card className="mb-6 border-border bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px] flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Buscar cupons..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="border-input bg-background pl-10 text-foreground"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] border-input bg-background text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
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
                Erro ao carregar cupons
              </div>
            ) : !couponsData?.data || couponsData.data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum cupom encontrado
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Código</TableHead>
                      <TableHead className="text-muted-foreground">Empresa</TableHead>
                      <TableHead className="text-muted-foreground">Desconto</TableHead>
                      <TableHead className="text-muted-foreground">Tipo</TableHead>
                      <TableHead className="text-muted-foreground">Validade</TableHead>
                      <TableHead className="text-muted-foreground">Usos</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponsData.data.map((coupon) => (
                      <TableRow key={coupon.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {coupon.codigo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {coupon.business_logo ? (
                              <img
                                src={coupon.business_logo}
                                alt=""
                                className="h-6 w-6 rounded object-cover"
                              />
                            ) : null}
                            {coupon.business_name || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {coupon.desconto}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {coupon.tipo_desconto || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(coupon.validade)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {coupon.usos_count || 0}
                          {coupon.max_usos ? ` / ${coupon.max_usos}` : null}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={coupon.is_active ? "default" : "secondary"}
                            className={
                              coupon.is_active
                                ? "bg-success text-success-foreground hover:bg-success/90"
                                : undefined
                            }
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
                              aria-label={`Ver cupom ${coupon.codigo}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(coupon)}
                              disabled={toggleActiveMutation.isPending}
                              aria-label={`${coupon.is_active ? "Desativar" : "Ativar"} cupom ${coupon.codigo}`}
                            >
                              <ToggleRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleDelete(coupon)}
                              disabled={deleteMutation.isPending}
                              aria-label={`Excluir cupom ${coupon.codigo}`}
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
                    Página {couponsData.page} de {couponsData.totalPages} • Total: {couponsData.total}
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
                          Math.min(couponsData.totalPages, currentPage + 1),
                        )
                      }
                      disabled={page === couponsData.totalPages}
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
          open={Boolean(selectedCoupon)}
          onOpenChange={(open) => {
            if (!open) setSelectedCoupon(null);
          }}
        >
          <DialogContent className="max-w-2xl border-border bg-popover text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Detalhes do cupom</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Informações completas do cupom
              </DialogDescription>
            </DialogHeader>
            {selectedCoupon ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CouponDetail label="Código" value={selectedCoupon.codigo} />
                  <CouponDetail label="Empresa" value={selectedCoupon.business_name || "-"} />
                  <CouponDetail label="Desconto" value={String(selectedCoupon.desconto)} />
                  <CouponDetail label="Tipo" value={selectedCoupon.tipo_desconto || "-"} />
                  <CouponDetail label="Validade" value={formatDate(selectedCoupon.validade)} />
                  <CouponDetail
                    label="Usos"
                    value={`${selectedCoupon.usos_count || 0}${selectedCoupon.max_usos ? ` / ${selectedCoupon.max_usos}` : ""}`}
                  />
                  <CouponDetail
                    label="Valor mínimo"
                    value={
                      selectedCoupon.valor_minimo
                        ? `R$ ${selectedCoupon.valor_minimo}`
                        : "-"
                    }
                  />
                  <CouponDetail
                    label="Status"
                    value={selectedCoupon.is_active ? "Ativo" : "Inativo"}
                  />
                </div>
                {selectedCoupon.description ? (
                  <CouponDetail
                    label="Descrição"
                    value={selectedCoupon.description}
                    multiline
                  />
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
        <ConfirmDialog />
      </div>
    </div>
  );
}

function CouponDetail({
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
