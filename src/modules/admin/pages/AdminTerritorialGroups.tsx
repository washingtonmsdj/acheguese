 
/**
 * AdminTerritorialGroups
 * 
 * Gestão de grupos territoriais no admin
 * Usa apenas base canônica reconciliada (locations, territorial_groups, territorial_group_members)
 */

import { useState } from 'react';
import { Plus, Edit, Power, MapPin, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useTerritorialGroups } from '../hooks/useTerritorialGroups';
import { TerritorialGroupForm } from '../components/TerritorialGroupForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

type GroupItem = ReturnType<typeof useTerritorialGroups>['groups'][number];

export default function AdminTerritorialGroups() {
  const {
    groups,
    isLoading,
    error,
    refetch,
    togglingGroupId,
    toggleStatus,
  } = useTerritorialGroups();
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);

  const handleCreate = () => {
    setEditingGroup(null);
    setFormOpen(true);
  };

  const handleEdit = (group: GroupItem) => {
    setEditingGroup(group);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingGroup(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Grupos Territoriais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie agrupamentos de bairros para governança territorial
          </p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm font-medium text-foreground">
            Não foi possível carregar os grupos territoriais.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error.message || 'Falha temporária. Tente novamente.'}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos Territoriais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie agrupamentos de bairros para governança territorial
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      {/* Lista de grupos */}
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum grupo territorial cadastrado
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Criar primeiro grupo
            </Button>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{group.name}</h3>
                    <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                      {group.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {group.description || 'Sem descrição'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Slug: {group.slug}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{group.members?.length || 0} bairros</span>
                    </div>
                    {group.anchor_city_id ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Cidade âncora: {group.anchor_city_id}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(group)}
                    className="gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant={group.status === 'active' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleStatus(group.id, group.status)}
                    disabled={togglingGroupId === group.id}
                    className="gap-1"
                  >
                    <Power className="h-3 w-3" />
                    {togglingGroupId === group.id
                      ? 'Processando...'
                      : group.status === 'active'
                        ? 'Desativar'
                        : 'Ativar'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog de formulário */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editar Grupo Territorial' : 'Novo Grupo Territorial'}
            </DialogTitle>
          </DialogHeader>
          <TerritorialGroupForm
            group={editingGroup}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
