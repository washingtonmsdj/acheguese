/**
 * AdminTouristPointFormPage — Formulário de criação/edição de ponto turístico
 *
 * Rotas:
 *   /admin/guia/pontos-turisticos/novo
 *   /admin/guia/pontos-turisticos/:id/editar
 */

import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useToast } from '@/shared/components/ui/use-toast';
import { useSessionContext } from '@/core/session';
import {
  useAdminTouristPoint,
  useCreateTouristPoint,
  useUpdateTouristPoint,
} from '../hooks/useAdminTouristPoints';
import {
  PRICE_TYPE,
  PRICE_TYPE_LABELS,
  TOURIST_POINT_STATUS,
  TOURIST_POINT_STATUS_LABELS,
  generateSlug,
} from '../types';
import type { CreateTouristPointInput, PriceType, TouristPointStatus } from '../types';

interface FormValues {
  location_id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  address_text: string;
  price_type: PriceType;
  price_text: string;
  opening_hours: string;
  accessibility_notes: string;
  official_url: string;
  is_featured: boolean;
  status: TouristPointStatus;
}

export default function AdminTouristPointFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSessionContext();
  const isEditing = !!id;

  const { data: existing, isLoading: loadingExisting } = useAdminTouristPoint(id);
  const createMutation = useCreateTouristPoint(user?.id);
  const updateMutation = useUpdateTouristPoint(user?.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      price_type: PRICE_TYPE.FREE,
      status: TOURIST_POINT_STATUS.DRAFT,
      is_featured: false,
    },
  });

  const titleValue = watch('title');

  // Auto-gera slug a partir do título (apenas na criação)
  useEffect(() => {
    if (!isEditing && titleValue) {
      setValue('slug', generateSlug(titleValue));
    }
  }, [titleValue, isEditing, setValue]);

  // Preenche o formulário ao editar
  useEffect(() => {
    if (existing) {
      reset({
        location_id:          existing.location_id,
        title:                existing.title,
        slug:                 existing.slug,
        summary:              existing.summary,
        description:          existing.description,
        address_text:         existing.address_text ?? '',
        price_type:           existing.price_type,
        price_text:           existing.price_text ?? '',
        opening_hours:        existing.opening_hours ?? '',
        accessibility_notes:  existing.accessibility_notes ?? '',
        official_url:         existing.official_url ?? '',
        is_featured:          existing.is_featured,
        status:               existing.status,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: FormValues) => {
    const input: CreateTouristPointInput = {
      location_id:          values.location_id,
      slug:                 values.slug || undefined,
      title:                values.title,
      summary:              values.summary,
      description:          values.description,
      address_text:         values.address_text || null,
      price_type:           values.price_type,
      price_text:           values.price_text || null,
      opening_hours:        values.opening_hours || null,
      accessibility_notes:  values.accessibility_notes || null,
      official_url:         values.official_url || null,
      is_featured:          values.is_featured,
      status:               values.status,
    };

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: 'Salvo', description: 'Ponto turístico atualizado.' });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: 'Criado', description: 'Ponto turístico criado com sucesso.' });
        navigate('/admin/guia/pontos-turisticos');
      }
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  if (isEditing && loadingExisting) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/guia/pontos-turisticos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? 'Editar ponto turístico' : 'Novo ponto turístico'}
          </h1>
          <p className="text-sm text-muted-foreground">Módulo Guide — vertical tourism</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Território */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Território</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location_id">Location ID *</Label>
              <Input
                id="location_id"
                {...register('location_id', { required: 'Obrigatório' })}
                placeholder="UUID da location (bairro/cidade)"
              />
              {errors.location_id && (
                <p className="text-xs text-destructive mt-1">{errors.location_id.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                UUID da tabela locations (bairro ou cidade).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Obrigatório' })}
                placeholder="Ex: Pelourinho"
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="gerado-automaticamente"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Gerado automaticamente a partir do título.
              </p>
            </div>

            <div>
              <Label htmlFor="summary">Resumo *</Label>
              <Input
                id="summary"
                {...register('summary', { required: 'Obrigatório' })}
                placeholder="Uma linha descrevendo o ponto turístico"
              />
              {errors.summary && (
                <p className="text-xs text-destructive mt-1">{errors.summary.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição completa *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Obrigatório' })}
                rows={5}
                placeholder="Descrição detalhada do ponto turístico"
              />
              {errors.description && (
                <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Localização e visita */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Localização e visita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address_text">Endereço textual</Label>
              <Input
                id="address_text"
                {...register('address_text')}
                placeholder="Ex: Largo do Pelourinho, s/n — Centro Histórico"
              />
            </div>

            <div>
              <Label htmlFor="opening_hours">Horário de funcionamento</Label>
              <Input
                id="opening_hours"
                {...register('opening_hours')}
                placeholder="Ex: Ter–Dom 9h–18h"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_type">Tipo de preço *</Label>
                <Select
                  defaultValue={PRICE_TYPE.FREE}
                  onValueChange={(v) => setValue('price_type', v as PriceType)}
                >
                  <SelectTrigger id="price_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRICE_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price_text">Detalhe do preço</Label>
                <Input
                  id="price_text"
                  {...register('price_text')}
                  placeholder="Ex: R$ 10 adulto"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accessibility_notes">Notas de acessibilidade</Label>
              <Input
                id="accessibility_notes"
                {...register('accessibility_notes')}
                placeholder="Ex: Rampas de acesso, piso tátil"
              />
            </div>

            <div>
              <Label htmlFor="official_url">Link oficial</Label>
              <Input
                id="official_url"
                {...register('official_url')}
                placeholder="https://..."
                type="url"
              />
            </div>
          </CardContent>
        </Card>

        {/* Publicação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={TOURIST_POINT_STATUS.DRAFT}
                onValueChange={(v) => setValue('status', v as TouristPointStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOURIST_POINT_STATUS_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_featured"
                onCheckedChange={(v) => setValue('is_featured', v)}
                defaultChecked={existing?.is_featured ?? false}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                Destaque
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Salvar alterações' : 'Criar ponto turístico'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/guia/pontos-turisticos">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
