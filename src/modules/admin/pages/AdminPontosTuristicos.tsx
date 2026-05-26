/**
 * AdminPontosTuristicos - Gerenciamento de pontos turísticos
 *
 * CRUD completo, escalável para qualquer cidade do Brasil.
 * ✅ SSOT COMPLIANT - Usa TouristPointService
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TouristPointService } from '@/core/guide/tourist-points';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  TouristPointCategory,
  TouristPointStatus,
  type TouristPoint,
  type CreateTouristPointInput,
} from '@/core/guide/tourist-points';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Switch } from '@/shared/components/ui/switch';
import { useToast } from '@/shared/components/ui/use-toast';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import {
  Plus, Loader2, Pencil, Trash2, Star, Search,
  MapPin, Camera, Eye, EyeOff, Filter,
  Accessibility, ParkingCircle, Utensils, Compass,
} from 'lucide-react';
import { useSessionContext } from '@/core/session';
import { TerritorialSelector } from '@/core/location/components/TerritorialSelector';
import { BRAZILIAN_STATES } from '@/core/location/data/brazilianStates';

type FormPayload = Partial<CreateTouristPointInput> & Record<string, unknown>;
type LocationSelection = {
  stateId: string;
  cityId: string;
  neighborhoodId: string;
  stateName: string;
  cityName: string;
  neighborhoodName: string;
};

export default function AdminPontosTuristicos() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const queryClient = useQueryClient();
  const { user } = useSessionContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<TouristPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // List
  const { data: points = [], isLoading } = useQuery({
    queryKey: ['admin-tourist-points', filterState, filterCity, filterCategory],
    queryFn: () =>
      TouristPointService.list({
        state: filterState || undefined,
        city: filterCity || undefined,
        category: (filterCategory as TouristPointCategory) || undefined,
      }),
  });

  // Filter client-side by search
  const filtered = searchQuery
    ? points.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : points;

  // Create
  const createMutation = useMutation({
    mutationFn: (input: CreateTouristPointInput) =>
      TouristPointService.create(input, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tourist-points'] });
      queryClient.invalidateQueries({ queryKey: ['tourist-points'] });
      setDialogOpen(false);
      toast({ title: 'Sucesso!', description: 'Ponto turístico criado.' });
    },
    onError: (err: unknown) =>
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Erro ao criar', variant: 'destructive' }),
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormPayload }) =>
      TouristPointService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tourist-points'] });
      queryClient.invalidateQueries({ queryKey: ['tourist-points'] });
      setDialogOpen(false);
      setEditingPoint(null);
      toast({ title: 'Sucesso!', description: 'Ponto turístico atualizado.' });
    },
    onError: (err: unknown) =>
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Erro ao atualizar', variant: 'destructive' }),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => TouristPointService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tourist-points'] });
      queryClient.invalidateQueries({ queryKey: ['tourist-points'] });
      toast({ title: 'Removido', description: 'Ponto turístico removido.' });
    },
  });

  // Toggle featured
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) =>
      TouristPointService.toggleFeatured(id, val),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tourist-points'] });
    },
  });

  const handleSubmit = (
    data: FormPayload,
    locationData: LocationSelection | null
  ) => {
    if (!locationData) {
      toast({ title: 'Erro', description: 'Selecione o território (estado, cidade e bairro)', variant: 'destructive' });
      return;
    }

    const payload: FormPayload = {
      ...data,
      // SSOT territorial
      location_id: locationData.neighborhoodId,
      state: locationData.stateId,
      city: locationData.cityName.toLowerCase(),
      // Campos legados removidos (não mais aceitos)
      neighborhood: undefined,
      address_text: undefined,
    };

    if (editingPoint) {
      updateMutation.mutate({ id: editingPoint.id, data: payload });
    } else {
      const createPayload: CreateTouristPointInput = {
        name: String(payload.name || ''),
        description: String(payload.description || ''),
        category: payload.category as TouristPointCategory,
        state: String(payload.state || ''),
        city: String(payload.city || ''),
        location_id: payload.location_id as string | undefined,
        short_description: payload.short_description as string | undefined,
        address_text: payload.address as string | undefined,
        latitude: payload.latitude as number | undefined,
        longitude: payload.longitude as number | undefined,
        photo_url: payload.photo_url as string | undefined,
        visiting_hours: payload.visiting_hours as string | undefined,
        entry_fee: payload.entry_fee as string | undefined,
        website: payload.website as string | undefined,
        phone: payload.phone as string | undefined,
        is_featured: payload.is_featured as boolean | undefined,
        accessibility: payload.accessibility as boolean | undefined,
        has_parking: payload.has_parking as boolean | undefined,
        has_restaurant: payload.has_restaurant as boolean | undefined,
        has_guide: payload.has_guide as boolean | undefined,
        tags: payload.tags as string[] | undefined,
      };
      createMutation.mutate(createPayload);
    }
  };

  const openEdit = (point: TouristPoint) => {
    setEditingPoint(point);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingPoint(null);
    setDialogOpen(true);
  };

  const handleDeletePoint = async (point: TouristPoint) => {
    const confirmed = await confirm({
      title: 'Remover ponto turistico',
      description: `O ponto "${point.name}" sera removido do guia publico.`,
      confirmLabel: 'Remover',
      variant: 'destructive',
    });
    if (!confirmed) return;
    deleteMutation.mutate(point.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Camera className="h-6 w-6 text-warning" />
            Pontos Turísticos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie pontos turísticos de todas as cidades
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Ponto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPoint ? 'Editar Ponto Turístico' : 'Novo Ponto Turístico'}
              </DialogTitle>
            </DialogHeader>
            <TouristPointForm
              point={editingPoint}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterState || "all"} onValueChange={(val) => setFilterState(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {BRAZILIAN_STATES.map((stateOption) => (
                  <SelectItem key={stateOption.code} value={stateOption.code}>
                    {stateOption.code.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Cidade..."
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-[150px]"
            />
            <Select value={filterCategory || "all"} onValueChange={(val) => setFilterCategory(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => {
                  const Icon = CATEGORY_ICONS[val as TouristPointCategory] ?? MapPin;

                  return (
                    <SelectItem key={val} value={val}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-foreground">{points.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-warning">{points.filter((p) => p.is_featured).length}</p>
            <p className="text-xs text-muted-foreground">Destaques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{new Set(points.map((p) => p.city)).size}</p>
            <p className="text-xs text-muted-foreground">Cidades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-accent">{new Set(points.map((p) => p.category)).size}</p>
            <p className="text-xs text-muted-foreground">Categorias</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-foreground mb-1">Nenhum ponto turístico</h3>
            <p className="text-sm text-muted-foreground">
              Clique em "Novo Ponto" para cadastrar o primeiro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((point) => (
            <Card key={point.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon/Image */}
                  <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {point.photo_url ? (
                      <img src={point.photo_url} alt={point.name} className="w-full h-full object-cover" />
                    ) : (() => {
                      const Icon = CATEGORY_ICONS[point.category] ?? MapPin;
                      return <Icon className="h-6 w-6 text-primary" aria-hidden="true" />;
                    })()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-foreground truncate">{point.name}</h3>
                      {point.is_featured && (
                        <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {point.city.charAt(0).toUpperCase() + point.city.slice(1)}, {point.state.toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {(() => {
                          const Icon = CATEGORY_ICONS[point.category] ?? MapPin;
                          return <Icon className="mr-1 inline h-3 w-3" aria-hidden="true" />;
                        })()}
                        {CATEGORY_LABELS[point.category]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{point.short_description || point.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleFeaturedMutation.mutate({
                          id: point.id,
                          val: !point.is_featured,
                        })
                      }
                      title={point.is_featured ? 'Remover destaque' : 'Destacar'}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          point.is_featured ? 'text-warning fill-warning' : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(point)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePoint(point)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}

// ── Form Component ───────────────────────────────────────────────────

function TouristPointForm({
  point,
  onSubmit,
  isLoading,
}: {
  point: TouristPoint | null;
  onSubmit: (data: FormPayload, locationData: LocationSelection | null) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [locationData, setLocationData] = useState<LocationSelection | null>(null);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const data: FormPayload = {
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      short_description: (fd.get('short_description') as string) || undefined,
      category: fd.get('category') as TouristPointCategory,
      address: (fd.get('address') as string) || undefined,
      latitude: parseFloat(fd.get('latitude') as string) || undefined,
      longitude: parseFloat(fd.get('longitude') as string) || undefined,
      photo_url: (fd.get('photo_url') as string) || undefined,
      visiting_hours: (fd.get('visiting_hours') as string) || undefined,
      entry_fee: (fd.get('entry_fee') as string) || undefined,
      website: (fd.get('website') as string) || undefined,
      phone: (fd.get('phone') as string) || undefined,
      is_featured: fd.get('is_featured') === 'on',
      accessibility: fd.get('accessibility') === 'on',
      has_parking: fd.get('has_parking') === 'on',
      has_restaurant: fd.get('has_restaurant') === 'on',
      has_guide: fd.get('has_guide') === 'on',
      tags: (fd.get('tags') as string)
        ?.split(',')
        .map((t) => t.trim())
        .filter(Boolean) || [],
    };

    onSubmit(data, locationData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Required fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" name="name" required defaultValue={point?.name} placeholder="Ex: Pelourinho" />
        </div>

        <div className="sm:col-span-2">
          {/* Seletor Territorial SSOT */}
          <TerritorialSelector
            initialLocationId={point?.location_id}
            onLocationChange={(locationId, data) => setLocationData(data)}
            allowCityOnly={false}
          />
        </div>

        <div>
          <Label htmlFor="category">Categoria *</Label>
          <select
            id="category"
            name="category"
            required
            defaultValue={point?.category || 'outro'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={3}
          defaultValue={point?.description}
          placeholder="Descrição detalhada do ponto turístico"
        />
      </div>

      <div>
        <Label htmlFor="short_description">Descrição curta</Label>
        <Input
          id="short_description"
          name="short_description"
          defaultValue={point?.short_description || ''}
          placeholder="Resumo em uma linha"
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="address">Endereço completo</Label>
          <Input
            id="address"
            name="address"
            defaultValue={typeof point?.address === 'string' ? point.address : ''}
            placeholder="Rua, número, complemento"
          />
        </div>
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" name="latitude" type="number" step="any" defaultValue={point?.latitude || ''} />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" name="longitude" type="number" step="any" defaultValue={point?.longitude || ''} />
        </div>
      </div>

      {/* Media */}
      <div>
        <Label htmlFor="photo_url">URL da foto</Label>
        <Input id="photo_url" name="photo_url" defaultValue={point?.photo_url || ''} placeholder="https://..." />
      </div>

      {/* Visit info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="visiting_hours">Horário de visitação</Label>
          <Input id="visiting_hours" name="visiting_hours" defaultValue={point?.visiting_hours || ''} placeholder="Seg-Sex 8h-17h" />
        </div>
        <div>
          <Label htmlFor="entry_fee">Valor de entrada</Label>
          <Input id="entry_fee" name="entry_fee" defaultValue={point?.entry_fee || ''} placeholder="Gratuito / R$ 10" />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={point?.website || ''} />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={point?.phone || ''} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={point?.tags?.join(', ') || ''}
          placeholder="patrimônio, UNESCO, barroco"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={point?.is_featured} />
          <Star className="h-4 w-4 text-warning" />
          Destaque
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="accessibility" defaultChecked={point?.accessibility} />
          <Accessibility className="h-4 w-4 text-primary" />
          Acessível
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="has_parking" defaultChecked={point?.has_parking} />
          <ParkingCircle className="h-4 w-4 text-blue-500" />
          Estacionamento
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="has_restaurant" defaultChecked={point?.has_restaurant} />
          <Utensils className="h-4 w-4 text-orange-500" />
          Restaurante
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="has_guide" defaultChecked={point?.has_guide} />
          <Compass className="h-4 w-4 text-emerald-500" />
          Guia disponível
        </label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {point ? 'Salvar Alterações' : 'Criar Ponto Turístico'}
      </Button>
    </form>
  );
}
