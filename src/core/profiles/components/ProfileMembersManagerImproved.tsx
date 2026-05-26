/**
 * PROFILE MEMBERS MANAGER IMPROVED - FASE 6 (UX MELHORADA)
 * Componente para gerenciar membros de perfis business/professional
 * 
 * MELHORIA: Aceita email em vez de UUID
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
import { Trash2, Plus, Shield, User, Crown, Loader2 } from 'lucide-react';

interface ProfileMembersManagerProps {
  profileId: string;
  profileType: 'business' | 'professional';
}

export function ProfileMembersManagerImproved({ profileId, profileType }: ProfileMembersManagerProps) {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { members, loading, inviteMemberByEmail, removeMember, updateRole } = useProfileMembers(profileId);
  
  const [showAdd, setShowAdd] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'member' as ProfileRole,
  });

  const handleInviteMember = async () => {
    if (!newMember.email.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o email do usuário',
        variant: 'destructive',
      });
      return;
    }

    setAddingMember(true);
    try {
      const result = await inviteMemberByEmail(newMember.email.trim(), newMember.role);

      if (!result.success) {
        toast({
          title: 'Erro ao adicionar membro',
          description: result.error || 'Não foi possível adicionar o membro.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Membro adicionado',
        description: result.data?.message || 'O membro foi adicionado com sucesso.',
      });
      
      setShowAdd(false);
      setNewMember({ email: '', role: 'member' });
    } catch (err: any) {
      toast({
        title: 'Erro ao adicionar membro',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setAddingMember(false);
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
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              disabled={addingMember}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite o email do usuário que deseja adicionar
            </p>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={newMember.role}
              onValueChange={(value) => setNewMember({ ...newMember, role: value as ProfileRole })}
              disabled={addingMember}
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
            <Button onClick={handleInviteMember} size="sm" disabled={addingMember}>
              {addingMember ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" size="sm" disabled={addingMember}>
              Cancelar
            </Button>
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
