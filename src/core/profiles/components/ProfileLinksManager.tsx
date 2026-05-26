/**
 * PROFILE LINKS MANAGER - FASE 6
 * Componente para gerenciar vínculos entre perfis
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

import { useState } from 'react';
import { useProfileLinks } from '../hooks/useProfileLinks';
import { useProfiles } from '../hooks/useProfiles';
import type { LinkType } from '../services/multi-profile/types';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import { useToast } from '@/shared/hooks/use-toast';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface ProfileLinksManagerProps {
  profileId: string;
}

export function ProfileLinksManager({ profileId }: ProfileLinksManagerProps) {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { links, loading, createLink, updateLink, deleteLink, reorderLinks } = useProfileLinks(profileId);
  const { profiles } = useProfiles();
  
  const [showCreate, setShowCreate] = useState(false);
  const [newLink, setNewLink] = useState({
    to_profile_id: '',
    link_type: 'owns' as LinkType,
    is_public: true,
  });

  // Filtrar perfis disponíveis (excluir o próprio perfil e perfis já vinculados)
  const linkedProfileIds = links.map(l => l.to_profile_id);
  const availableProfiles = profiles.filter(
    p => p.id !== profileId && !linkedProfileIds.includes(p.id)
  );

  const handleCreate = async () => {
    if (!newLink.to_profile_id) {
      toast({
        title: 'Erro',
        description: 'Selecione um perfil para vincular',
        variant: 'destructive',
      });
      return;
    }

    const result = await createLink(
      newLink.to_profile_id,
      newLink.link_type,
      newLink.is_public,
      links.length
    );

    if (result.success) {
      toast({
        title: 'Vínculo criado',
        description: 'O vínculo foi criado com sucesso.',
      });
      setShowCreate(false);
      setNewLink({ to_profile_id: '', link_type: 'owns', is_public: true });
    } else {
      toast({
        title: 'Erro ao criar vínculo',
        description: result.error || 'Não foi possível criar o vínculo.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (linkId: string) => {
    const confirmed = await confirm({
      title: 'Remover vinculo',
      description: 'Este relacionamento deixara de aparecer entre os perfis.',
      confirmLabel: 'Remover',
      variant: 'destructive',
    });
    if (!confirmed) return;

    const result = await deleteLink(linkId);

    if (result.success) {
      toast({
        title: 'Vínculo removido',
        description: 'O vínculo foi removido com sucesso.',
      });
    } else {
      toast({
        title: 'Erro ao remover',
        description: result.error || 'Não foi possível remover o vínculo.',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublic = async (linkId: string, currentValue: boolean) => {
    const result = await updateLink(linkId, { is_public: !currentValue });

    if (result.success) {
      toast({
        title: 'Visibilidade atualizada',
        description: 'A visibilidade do vínculo foi atualizada.',
      });
    } else {
      toast({
        title: 'Erro ao atualizar',
        description: result.error || 'Não foi possível atualizar a visibilidade.',
        variant: 'destructive',
      });
    }
  };

  const getLinkTypeLabel = (type: LinkType) => {
    switch (type) {
      case 'owns': return 'Proprietário';
      case 'works_for': return 'Trabalha em';
      case 'drives_for': return 'Motorista de';
      case 'partner': return 'Parceiro';
    }
  };

  const getProfileLabel = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile ? `${profile.display_name} (@${profile.handle})` : 'Perfil';
  };

  if (loading) {
    return <div className="text-center py-4">Carregando vínculos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vínculos entre Perfis</h3>
          <p className="text-sm text-muted-foreground">
            Conecte seus perfis para mostrar relacionamentos
          </p>
        </div>
        {availableProfiles.length > 0 && (
          <Button onClick={() => setShowCreate(!showCreate)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Vínculo
          </Button>
        )}
      </div>

      {/* Formulário de Criação */}
      {showCreate && (
        <div className="bg-muted p-4 rounded-lg space-y-4">
          <div>
            <Label htmlFor="to_profile">Perfil de Destino</Label>
            <Select
              value={newLink.to_profile_id}
              onValueChange={(value) => setNewLink({ ...newLink, to_profile_id: value })}
            >
              <SelectTrigger id="to_profile">
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {availableProfiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name} (@{p.handle}) - {p.profile_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="link_type">Tipo de Vínculo</Label>
            <Select
              value={newLink.link_type}
              onValueChange={(value) => setNewLink({ ...newLink, link_type: value as LinkType })}
            >
              <SelectTrigger id="link_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owns">Proprietário</SelectItem>
                <SelectItem value="works_for">Trabalha em</SelectItem>
                <SelectItem value="drives_for">Motorista de</SelectItem>
                <SelectItem value="partner">Parceiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={newLink.is_public}
              onCheckedChange={(checked) => setNewLink({ ...newLink, is_public: checked })}
            />
            <Label htmlFor="is_public">Vínculo público</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">Criar Vínculo</Button>
            <Button onClick={() => setShowCreate(false)} variant="outline" size="sm">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista de Vínculos */}
      {links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum vínculo criado ainda
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div
              key={link.id}
              className="flex items-center gap-4 p-4 bg-card rounded-lg border"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              
              <div className="flex-1">
                <p className="font-medium">{getProfileLabel(link.to_profile_id)}</p>
                <p className="text-sm text-muted-foreground">{getLinkTypeLabel(link.link_type)}</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={link.is_public}
                  onCheckedChange={() => handleTogglePublic(link.id, link.is_public)}
                  aria-label="Público"
                />
                <span className="text-xs text-muted-foreground w-16">
                  {link.is_public ? 'Público' : 'Privado'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(link.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}
