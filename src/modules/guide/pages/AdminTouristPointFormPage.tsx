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
import { zodResolver } from '@hookform/resolvers/zod';
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
import type { CreateTouristPointInput, PriceType, UpdateTouristPointInput } from '../types';
import { InlineFieldError } from '@/shared/components/ui/InlineFieldError';
import {
  TouristPointFormSchema,
  type TouristPointFormInput,
} from '../schemas/touristPoint.schema';

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
  } = useForm<TouristPointFormInput>({
    resolver: zodResolver(TouristPointFormSchema),
    mode: 'onBlur',
    defaultValues: {
      location_id: '',
      title: '',
      slug: '',
      summary: '',
      description: '',
      address_text: null,
      price_type: PRICE_TYPE.FREE,
      price_text: null,
      opening_hours: null,
      accessibility_notes: null,
      official_url: null,
      is_featured: false,
      status: TOURIST_POINT_STATUS.DRAFT,
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
      const point = existing as unknown as Record<string, unknown>;
      const normalizedStatus =
        point.status === TOURIST_POINT_STATUS.PUBLISHED || point.status === TOURIST_POINT_STATUS.ARCHIVED
          ? (point.status as TouristPointFormInput['status'])
          : TOURIST_POINT_STATUS.DRAFT;
      reset({
        location_id:          String(point.location_id ?? ''),
        title:                String(point.title ?? point.name ?? ''),
        slug:                 String(point.slug ?? ''),
        summary:              String(point.summary ?? point.short_description ?? ''),
        description:          String(point.description ?? ''),
        address_text:         (point.address_text as string | null | undefined) ?? null,
        price_type:           (point.price_type as PriceType) ?? PRICE_TYPE.FREE,
        price_text:           (point.price_text as string | null | undefined) ?? null,
        opening_hours:        (point.opening_hours as string | null | undefined) ?? null,
        accessibility_notes:  (point.accessibility_notes as string | null | undefined) ?? null,
        official_url:         (point.official_url as string | null | undefined) ?? null,
        is_featured:          Boolean(point.is_featured),
        status:               normalizedStatus,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: TouristPointFormInput) => {
    const input: CreateTouristPointInput = {
      location_id:          values.location_id,
      slug:                 values.slug || undefined,
      title:                values.title,
      summary:              values.summary,
      description:          values.description,
      address_text:         values.address_text,
      price_type:           values.price_type,
      price_text:           values.price_text,
      opening_hours:        values.opening_hours,
      accessibility_notes:  values.accessibility_notes,
      official_url:         values.official_url,
      is_featured:          values.is_featured,
    };

    try {
      if (isEditing && id) {
        const updateInput: UpdateTouristPointInput = {
          ...input,
          status: values.status,
        };
        await updateMutation.mutateAsync({ id, input: updateInput });
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
                {...register('location_id')}
                placeholder="UUID da location (bairro/cidade)"
              />
              <InlineFieldError message={errors.location_id?.message} />
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
                {...register('title')}
                placeholder="Ex: Pelourinho"
              />
              <InlineFieldError message={errors.title?.message} />
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
                {...register('summary')}
                placeholder="Uma linha descrevendo o ponto turístico"
              />
              <InlineFieldError message={errors.summary?.message} />
            </div>

            <div>
              <Label htmlFor="description">Descrição completa *</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={5}
                placeholder="Descrição detalhada do ponto turístico"
              />
              <InlineFieldError message={errors.description?.message} />
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
              <InlineFieldError message={errors.address_text?.message} />
            </div>

            <div>
              <Label htmlFor="opening_hours">Horário de funcionamento</Label>
              <Input
                id="opening_hours"
                {...register('opening_hours')}
                placeholder="Ex: Ter–Dom 9h–18h"
              />
              <InlineFieldError message={errors.opening_hours?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_type">Tipo de preço *</Label>
                <Select
                  defaultValue={PRICE_TYPE.FREE}
                  onValueChange={(v) => setValue('price_type', v as TouristPointFormInput['price_type'], { shouldValidate: true })}
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
                <InlineFieldError message={errors.price_type?.message} />
              </div>

              <div>
                <Label htmlFor="price_text">Detalhe do preço</Label>
                <Input
                  id="price_text"
                  {...register('price_text')}
                  placeholder="Ex: R$ 10 adulto"
                />
                <InlineFieldError message={errors.price_text?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="accessibility_notes">Notas de acessibilidade</Label>
              <Input
                id="accessibility_notes"
                {...register('accessibility_notes')}
                placeholder="Ex: Rampas de acesso, piso tátil"
              />
              <InlineFieldError message={errors.accessibility_notes?.message} />
            </div>

            <div>
              <Label htmlFor="official_url">Link oficial</Label>
              <Input
                id="official_url"
                {...register('official_url')}
                placeholder="https://..."
                type="url"
              />
              <InlineFieldError message={errors.official_url?.message} />
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
                onValueChange={(v) => setValue('status', v as TouristPointFormInput['status'])}
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
