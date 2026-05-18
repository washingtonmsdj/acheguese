/**
 * AdminBillingPlansEditor - Página admin para CRUD de planos de billing
 * 
 * ADMIN ONLY
 * SSOT: Usa BillingPlanService via hooks
 */

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAllBillingPlans,
  useCreateBillingPlan,
  useUpdateBillingPlan,
  useDeleteBillingPlan,
  useToggleBillingPlanActive,
  useToggleBillingPlanFeatured,
} from '@/core/billing/hooks/useBillingPlansCRUD';
import { BillingPlanForm } from '@/modules/admin/components/BillingPlanForm';
import type { BillingPlan } from '@/core/billing/services/BillingPlanService';

export default function AdminBillingPlansEditor() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Queries
  const { data: plans, isLoading } = useAllBillingPlans();

  // Mutations
  const createMutation = useCreateBillingPlan();
  const updateMutation = useUpdateBillingPlan();
  const deleteMutation = useDeleteBillingPlan();
  const toggleActiveMutation = useToggleBillingPlanActive();
  const toggleFeaturedMutation = useToggleBillingPlanFeatured();

  const handleCreate = (data: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      },
    });
  };

  const handleUpdate = (data: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingPlan) return;
    updateMutation.mutate(
      { id: editingPlan.id, updates: data },
      {
        onSuccess: () => {
          setEditingPlan(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingPlanId) return;
    deleteMutation.mutate(deletingPlanId, {
      onSuccess: () => {
        setDeletingPlanId(null);
      },
    });
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !isActive });
  };

  const handleToggleFeatured = (id: string, isFeatured: boolean) => {
    toggleFeaturedMutation.mutate({ id, isFeatured: !isFeatured });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Gerenciar Planos de Billing
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie, edite e gerencie os planos de assinatura
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && plans && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Planos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.filter((p) => p.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Planos Gratuitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.filter((p) => p.priceCents === 0).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Planos Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.filter((p) => p.priceCents > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Planos */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : plans && plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-sm">{plan.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {plan.isFeatured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{plan.priceDisplay}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {plan.billingPeriod === 'monthly'
                          ? 'Mensal'
                          : plan.billingPeriod === 'yearly'
                          ? 'Anual'
                          : 'Vitalício'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{plan.features.length} features</Badge>
                    </TableCell>
                    <TableCell>
                      {plan.isActive ? (
                          <Badge variant="secondary">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.displayOrder}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleActive(plan.id, plan.isActive)}
                          title={plan.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {plan.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleFeatured(plan.id, plan.isFeatured)}
                          title={plan.isFeatured ? 'Remover destaque' : 'Destacar'}
                        >
                          {plan.isFeatured ? (
                            <StarOff className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingPlan(plan)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingPlanId(plan.id)}
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum plano cadastrado</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Criar Plano */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Plano</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo plano de billing
            </DialogDescription>
          </DialogHeader>
          <BillingPlanForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Plano */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualize as informações do plano {editingPlan?.name}
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <BillingPlanForm
              plan={editingPlan}
              onSubmit={handleUpdate}
              onCancel={() => setEditingPlan(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Deleção */}
      <AlertDialog open={!!deletingPlanId} onOpenChange={() => setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O plano será permanentemente removido do
              banco de dados.
              <br />
              <br />
              <strong className="text-destructive">
                ATENÇÃO: Usuários com assinaturas ativas deste plano podem ser afetados!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
