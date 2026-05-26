/**
 * PROFILE MEMBERS MANAGER - FASE 6
 * Componente para gerenciar membros de perfis business/professional
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

import { useState } from 'react';
import { useProfileMembers } from '../hooks/useProfileMembers';
import type { ProfileRole } from '../services/multi-profile/types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import { useToast } from '@/shared/hooks/use-toast';
import { Trash2, Plus, Shield, User, Crown } from 'lucide-react';

interface ProfileMembersManagerProps {
  profileId: string;
  profileType: 'business' | 'professional';
}

export function ProfileMembersManager({ profileId, profileType }: ProfileMembersManagerProps) {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { members, loading, addMember, removeMember, updateRole } = useProfileMembers(profileId);
  
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({
    user_id: '',
    role: 'member' as ProfileRole,
  });

  const handleAdd = async () => {
    if (!newMember.user_id.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe o ID do usuário',
        variant: 'destructive',
      });
      return;
    }

    const result = await addMember(newMember.user_id, newMember.role);

    if (result.success) {
      toast({
        title: 'Membro adicionado',
        description: 'O membro foi adicionado com sucesso.',
      });
      setShowAdd(false);
      setNewMember({ user_id: '', role: 'member' });
    } else {
      toast({
        title: 'Erro ao adicionar',
        description: result.error || 'Não foi possível adicionar o membro.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Remover membro',
      description: 'Este usuario perdera acesso a este perfil.',
      confirmLabel: 'Remover',
      variant: 'destructive',
    });
    if (!confirmed) return;

    const result = await removeMember(userId);

    if (result.success) {
      toast({
        title: 'Membro removido',
        description: 'O membro foi removido com sucesso.',
      });
    } else {
      toast({
        title: 'Erro ao remover',
        description: result.error || 'Não foi possível remover o membro.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProfileRole) => {
    const result = await updateRole(userId, newRole);

    if (result.success) {
      toast({
        title: 'Role atualizada',
        description: 'A role do membro foi atualizada.',
      });
    } else {
      toast({
        title: 'Erro ao atualizar',
        description: result.error || 'Não foi possível atualizar a role.',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: ProfileRole) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member': return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: ProfileRole) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Carregando membros...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Membros do Perfil</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie quem tem acesso a este perfil {profileType}
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {/* Formulário de Adição */}
      {showAdd && (
        <div className="bg-muted p-4 rounded-lg space-y-4">
          <div>
            <Label htmlFor="user_id">ID do Usuário</Label>
            <Input
              id="user_id"
              placeholder="UUID do usuário"
              value={newMember.user_id}
              onChange={(e) => setNewMember({ ...newMember, user_id: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              O usuário deve estar cadastrado no sistema
            </p>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={newMember.role}
              onValueChange={(value) => setNewMember({ ...newMember, role: value as ProfileRole })}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="owner">Proprietário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm">Adicionar</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" size="sm">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista de Membros */}
      {members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum membro adicionado ainda
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 bg-card rounded-lg border"
            >
              {getRoleIcon(member.role)}
              
              <div className="flex-1">
                <p className="font-medium">{member.user_id}</p>
                <p className="text-sm text-muted-foreground">
                  Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <Select
                value={member.role}
                onValueChange={(value) => handleUpdateRole(member.user_id, value as ProfileRole)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="owner">Proprietário</SelectItem>
                </SelectContent>
              </Select>

              {member.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(member.user_id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}
