/**
 * TerritorialGroupForm
 *
 * Formulario de criacao/edicao de grupo territorial.
 * O inventario administrativo ja entrega memberships; o formulario nao abre
 * uma segunda leitura apenas para reconstruir o mesmo estado.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TerritorialGroupService } from '@/core/territorial';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { Building2, FileText, Hash, Loader2, MapPin, Users } from 'lucide-react';
import { DistrictSelector } from './DistrictSelector';

interface TerritorialGroupFormProps {
  group?: {
    id: string;
    name?: string | null;
    slug?: string | null;
    description?: string | null;
    anchor_city_id?: string | null;
    status?: string | null;
    members?: Array<{
      id: string;
      name?: string | null;
    }>;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type GroupFormPayload = {
  name: string;
  slug: string;
  description?: string;
  anchor_city_id: string;
  member_location_ids: string[];
};

const service = new TerritorialGroupService();

export function TerritorialGroupForm({ group, onSuccess, onCancel }: TerritorialGroupFormProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [anchorCityId, setAnchorCityId] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [currentMemberNames, setCurrentMemberNames] = useState<string[]>([]);

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
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  useEffect(() => {
    if (!group) {
      setName('');
      setSlug('');
      setDescription('');
      setAnchorCityId('');
      setSelectedDistricts([]);
      setCurrentMemberNames([]);
      return;
    }

    const members = group.members ?? [];
    setName(group.name ?? '');
    setSlug(group.slug ?? '');
    setDescription(group.description ?? '');
    setAnchorCityId(group.anchor_city_id ?? '');
    setSelectedDistricts(members.map((member) => member.id));
    setCurrentMemberNames(members.map((member) => member.name ?? 'Desconhecido'));
  }, [group]);

  const createMutation = useMutation({
    mutationFn: async (data: GroupFormPayload) => {
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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao criar grupo';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GroupFormPayload) => {
      if (!group) throw new Error('Grupo territorial nao selecionado');

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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar grupo';
      toast.error(message);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) return toast.error('Nome e obrigatorio');
    if (!slug.trim()) return toast.error('Slug e obrigatorio');
    if (!anchorCityId) return toast.error('Cidade ancora e obrigatoria');
    if (selectedDistricts.length === 0) return toast.error('Selecione pelo menos um bairro');

    const data: GroupFormPayload = {
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
      {group && (
        <div className="rounded-xl border border-border bg-gradient-to-br from-purple-500/5 to-transparent p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{group.name}</h4>
              <p className="text-xs text-muted-foreground">
                {group.status === 'active' ? 'Ativo' : 'Inativo'} - Slug: {group.slug}
              </p>
            </div>
          </div>

          {currentMemberNames.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Bairros atuais ({currentMemberNames.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...currentMemberNames].sort().map((memberName, index) => (
                  <Badge
                    key={`${memberName}-${index}`}
                    variant="secondary"
                    className="text-[11px] px-2 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  >
                    <MapPin className="h-2.5 w-2.5 mr-1" />
                    {memberName}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum bairro vinculado</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Nome do Grupo
            </label>
            <Input
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Ex: Area Central, Regiao Comercial, Orla Norte"
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
              onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
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
            Descricao (opcional)
          </label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Breve descricao do grupo territorial..."
            rows={2}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>
      </div>

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
          anchorCityLocked={Boolean(group)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t">
        <p className="text-[11px] text-muted-foreground hidden sm:block">
          {group
            ? 'A cidade ancora permanece fixa; nome, slug e bairros podem ser atualizados.'
            : 'O grupo sera criado inativo e podera ser ativado apos a revisao.'}
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
            {group ? 'Salvar Alteracoes' : 'Criar Grupo'}
          </Button>
        </div>
      </div>
    </form>
  );
}
