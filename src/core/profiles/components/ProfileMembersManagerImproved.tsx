/**
 * PROFILE MEMBERS MANAGER IMPROVED - FASE 6 (UX MELHORADA)
 * Componente para gerenciar membros de perfis business/professional
 * 
 * MELHORIA: Aceita email em vez de UUID
 */

import { useState } from 'react';
import { useProfileMembers } from '../hooks/useProfileMembers';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { MultiProfileService } from '../services/multi-profile';
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

type EditableProfileRole = Exclude<ProfileRole, 'owner'>;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function ProfileMembersManagerImproved({ profileId, profileType }: ProfileMembersManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { members, loading, error, inviteMemberByEmail, removeMember, updateRole, refetch } = useProfileMembers(profileId);
  const canManageAccess = Boolean(
    user && members.some((member) => member.user_id === user.id && member.role === 'owner'),
  );
  
  const [showAdd, setShowAdd] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [transferringOwnerId, setTransferringOwnerId] = useState<string | null>(null);
  const defaultInviteRole: EditableProfileRole =
    profileType === 'business' ? 'admin' : 'member';
  const [newMember, setNewMember] = useState<{
    email: string;
    role: EditableProfileRole;
  }>({
    email: '',
    role: defaultInviteRole,
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
        title: 'Acesso concedido',
        description: result.data?.message || 'A pessoa foi adicionada com sucesso.',
      });
      
      setShowAdd(false);
      setNewMember({ email: '', role: defaultInviteRole });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao adicionar membro',
        description: getErrorMessage(error, 'Tente novamente.'),
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

  const handleUpdateRole = async (
    userId: string,
    newRole: EditableProfileRole,
  ) => {
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

  const handleTransferOwnership = async (
    userId: string,
    memberName: string,
  ) => {
    const confirmed = await confirm({
      title: 'Transferir propriedade',
      description:
        `${memberName} passará a ser o Proprietário deste perfil. Você continuará como Gestor e deixará de controlar pessoas e acessos.`,
      confirmLabel: 'Transferir propriedade',
      variant: 'destructive',
    });
    if (!confirmed) return;

    setTransferringOwnerId(userId);
    try {
      const result = await MultiProfileService.transferOwnership(profileId, userId);

      if (!result.success) {
        toast({
          title: 'Erro ao transferir propriedade',
          description: result.error || 'Não foi possível transferir a propriedade.',
          variant: 'destructive',
        });
        return;
      }

      await refetch();
      toast({
        title: 'Propriedade transferida',
        description:
          'A pessoa agora é Proprietário deste perfil e seu acesso passou a Gestor.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao transferir propriedade',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setTransferringOwnerId(null);
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
      case 'admin': return 'Gestor';
      case 'member': return 'Membro';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Carregando membros...</div>;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
      >
        <div>
          <p className="font-medium text-destructive">
            Não foi possível carregar pessoas e acessos
          </p>
          <p className="text-sm text-muted-foreground">
            A lista não será tratada como vazia enquanto a leitura estiver indisponível.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pessoas e acesso</h3>
          <p className="text-sm text-muted-foreground">
            Proprietario, gestores e membros deste perfil {profileType}.
          </p>
        </div>
        {canManageAccess ? (
          <Button onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar pessoa
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground sm:grid-cols-3">
        <div><strong className="text-foreground">Proprietario</strong><br />Controle total, pessoas/acesso e transferencia.</div>
        <div><strong className="text-foreground">Gestor</strong><br />Opera o dia a dia, mas nao gerencia acessos.</div>
        <div><strong className="text-foreground">Membro</strong><br />Vinculo limitado; nao administra a Central da empresa hoje.</div>
      </div>

      {!canManageAccess ? (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Somente o proprietario pode convidar, remover ou alterar o acesso de outras pessoas.
        </p>
      ) : null}

      {/* Formulário de Adição */}
      {canManageAccess && showAdd && (
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
            <Label htmlFor="role">Nivel de acesso</Label>
            <Select
              value={newMember.role}
              onValueChange={(value) => setNewMember({ ...newMember, role: value as EditableProfileRole })}
              disabled={addingMember}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {profileType !== 'business' ? (
                  <SelectItem value="member">Membro</SelectItem>
                ) : null}
                <SelectItem value="admin">Gestor</SelectItem>
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
                <p className="font-medium">
                  {member.display_name || member.email || 'Pessoa da equipe'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.email ? <span>{member.email} · </span> : null}
                  Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {canManageAccess && member.role !== 'owner' ? (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      handleUpdateRole(member.user_id, value as EditableProfileRole)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {profileType !== 'business' ? (
                        <SelectItem value="member">Membro</SelectItem>
                      ) : null}
                      <SelectItem value="admin">Gestor</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={transferringOwnerId !== null}
                    onClick={() =>
                      handleTransferOwnership(
                        member.user_id,
                        member.display_name || member.email || 'Esta pessoa',
                      )
                    }
                  >
                    {transferringOwnerId === member.user_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transferindo...
                      </>
                    ) : (
                      'Transferir propriedade'
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={transferringOwnerId !== null}
                    onClick={() => handleRemove(member.user_id)}
                    aria-label="Remover acesso"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <span className="min-w-24 rounded-md border px-3 py-2 text-center text-sm">
                  {getRoleLabel(member.role)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}
