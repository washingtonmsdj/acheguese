/**
 * TerritorialGroupForm
 * 
 * Formulário de criação/edição de grupo territorial
 * UI melhorada com exibição de membros atuais e melhor organização
 * 
 * ✅ SSOT - Usa TerritorialGroupService
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TerritorialGroupService } from '@/core/territorial/services/TerritorialGroupService';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, MapPin, Users, X, Hash, FileText, Building2 } from 'lucide-react';
import { DistrictSelector } from './DistrictSelector';
interface TerritorialGroupFormProps {
  group?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const service = new TerritorialGroupService();

export function TerritorialGroupForm({ group, onSuccess, onCancel }: TerritorialGroupFormProps) {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [anchorCityId, setAnchorCityId] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [currentMemberNames, setCurrentMemberNames] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!group) {
      const generated = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generated);
    }
  };

  useEffect(() => {
    async function loadGroupMembers() {
      if (group && group.id) {
        setName(group.name || '');
        setSlug(group.slug || '');
        setDescription(group.description || '');
        setAnchorCityId(group.parent_id || '');
        setLoadingMembers(true);
        
        try {
          // ✅ SSOT - Buscar membros via TerritorialGroupService
          const members = await service.getGroupMembers(group.id);
          
          if (members) {
            setSelectedDistricts(members.map(m => m.location_id));
            setCurrentMemberNames(members.map(m => m.location_name || 'Desconhecido'));
          }
        } catch (err) {
          logger.error('Error loading group members:', err);
          if (group.member_ids?.length > 0) {
            setSelectedDistricts(group.member_ids);
          }
        } finally {
          setLoadingMembers(false);
        }
      }
    }
    
    loadGroupMembers();
  }, [group]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return service.createGroup({
        name: data.name,
        slug: data.slug,
        description: data.description,
        anchor_city_id: data.anchor_city_id,
        member_location_ids: data.member_location_ids,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'territory-management'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'territorial-groups'] });
      toast.success('Grupo criado com sucesso');
      onSuccess();
    },
    onError: (error: any) => {
      logger.error('Error creating group:', error);
      toast.error(error.message || 'Erro ao criar grupo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await service.updateGroup(group.id, {
        name: data.name,
        slug: data.slug,
        description: data.description,
      });
      await service.replaceMembers(group.id, data.member_location_ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'territorial-groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'territory-management'] });
      toast.success('Grupo atualizado com sucesso');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar grupo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Nome é obrigatório');
    if (!slug.trim()) return toast.error('Slug é obrigatório');
    if (!anchorCityId) return toast.error('Cidade âncora é obrigatória');
    if (selectedDistricts.length === 0) return toast.error('Selecione pelo menos um bairro');

    const data = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      anchor_city_id: anchorCityId,
      member_location_ids: selectedDistricts,
    };

    if (group) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumo do grupo (edição) */}
      {group && (
        <div className="rounded-xl border border-border bg-gradient-to-br from-purple-500/5 to-transparent p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{group.name}</h4>
              <p className="text-xs text-muted-foreground">
                {group.status === 'active' ? '● Ativo' : '○ Inativo'} · Slug: {group.slug}
              </p>
            </div>
          </div>
          
          {/* Membros atuais */}
          {loadingMembers ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando membros...
            </div>
          ) : currentMemberNames.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Bairros atuais ({currentMemberNames.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentMemberNames.sort().map((name, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="text-[11px] px-2 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  >
                    <MapPin className="h-2.5 w-2.5 mr-1" />
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum bairro vinculado</p>
          )}
        </div>
      )}

      {/* Dados básicos */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Nome do Grupo
            </label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Complexo do Nordeste de Amaralina"
              disabled={isSubmitting}
              className="h-11"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              Slug
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="complexo-nordeste-amaralina"
              disabled={isSubmitting}
              className="h-11 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Gerado automaticamente. Usado na URL.
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Descrição (opcional)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição do grupo territorial..."
            rows={2}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>
      </div>

      {/* Seletor de bairros */}
      <div className="border-t pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Cidade e Bairros</h3>
          {selectedDistricts.length > 0 && (
            <Badge className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
              {selectedDistricts.length} selecionados
            </Badge>
          )}
        </div>
        <DistrictSelector
          anchorCityId={anchorCityId}
          onAnchorCityChange={setAnchorCityId}
          selectedDistricts={selectedDistricts}
          onDistrictsChange={setSelectedDistricts}
          disabled={isSubmitting}
        />
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t">
        <p className="text-[11px] text-muted-foreground hidden sm:block">
          {group ? 'As alterações serão aplicadas imediatamente' : 'O grupo será criado como ativo'}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-[90px]"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="gap-2 min-w-[130px]"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {group ? 'Salvar Alterações' : 'Criar Grupo'}
          </Button>
        </div>
      </div>
    </form>
  );
}
