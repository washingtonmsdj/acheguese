/**
 * AdminBusinessesPage — Gestão de empresas
 *
 * Lista e gerencia todas as empresas.
 * Consome hooks (SSOT).
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useBusinesses, useToggleBusinessStatus, useUpdateBusinessPlan } from '@/modules/admin/hooks/useAdmin';
import { Search, Building2, DollarSign, ShoppingCart, Bike } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminBusinessesPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filters = {
    search: search || undefined,
    plan_tier: planFilter !== 'all' ? planFilter : undefined,
    is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
  };

  const { data: businesses, isLoading } = useBusinesses(filters);
  const toggleStatusMutation = useToggleBusinessStatus();
  const updatePlanMutation = useUpdateBusinessPlan();

  const handleToggleStatus = (businessId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({
      businessId,
      isActive: !currentStatus,
    });
  };

  const handleUpdatePlan = (businessId: string, planTier: string) => {
    updatePlanMutation.mutate({
      businessId,
      planTier,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestão de Empresas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as empresas da plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de Plano */}
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os planos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            Empresas ({businesses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : businesses && businesses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Entregas</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{business.name}</p>
                          <p className="text-xs text-muted-foreground">
                            /{business.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={business.plan_tier}
                        onValueChange={(value) =>
                          handleUpdatePlan(business.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={business.is_active ? 'default' : 'secondary'}>
                        {business.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                        {business.total_orders}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {business.total_revenue.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Bike className="h-3 w-3 text-muted-foreground" />
                        {business.total_deliveries}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(business.created_at), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(business.id, business.is_active)
                        }
                      >
                        {business.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma empresa encontrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminBusinessesPage;
