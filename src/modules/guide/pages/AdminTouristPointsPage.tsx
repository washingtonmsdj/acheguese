/**
 * AdminTouristPointsPage — Listagem admin de pontos turísticos
 *
 * Rota: /admin/guia/pontos-turisticos
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Pencil, Trash2, Star, Search, Camera, MapPin } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
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
  useAdminTouristPoints,
  useDeleteTouristPoint,
  useSetTouristPointStatus,
  useSetTouristPointFeatured,
} from '../hooks/useAdminTouristPoints';
import { TOURIST_POINT_STATUS_LABELS, PRICE_TYPE_LABELS } from '../tourist-points/types';
import type { TouristPoint, TouristPointStatus } from '../tourist-points/types';

// Empty list means "all territories"; scoped filtering must come from the
// location selector, not from a launch-city constant.
const ADMIN_TOURIST_POINT_LOCATION_IDS: string[] = [];

export default function AdminTouristPointsPage() {
  const { toast } = useToast();
  const { user } = useSessionContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TouristPointStatus | ''>('');

  // Para o admin, listamos com location_ids vazio = sem filtro territorial
  // Em produção, o admin pode selecionar o território
  const { data: points = [], isLoading } = useAdminTouristPoints(ADMIN_TOURIST_POINT_LOCATION_IDS);

  const deleteMutation = useDeleteTouristPoint();
  const statusMutation = useSetTouristPointStatus(user?.id);
  const featuredMutation = useSetTouristPointFeatured(user?.id);

  const filtered = points.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.summary.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (point: TouristPoint) => {
    if (!confirm(`Remover "${point.title}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteMutation.mutateAsync(point.id);
      toast({ title: 'Removido', description: `"${point.title}" foi removido.` });
    } catch (err: unknown) {
      toast({
        title: 'Erro ao remover',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (point: TouristPoint) => {
    try {
      await featuredMutation.mutateAsync({ id: point.id, is_featured: !point.is_featured });
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (point: TouristPoint, status: TouristPointStatus) => {
    try {
      await statusMutation.mutateAsync({ id: point.id, status });
      toast({ title: 'Status atualizado', description: TOURIST_POINT_STATUS_LABELS[status] });
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
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
          <p className="text-sm text-muted-foreground">Módulo Guide — vertical tourism</p>
        </div>
        <Button asChild>
          <Link to="/admin/guia/pontos-turisticos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo ponto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as TouristPointStatus | '')}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(TOURIST_POINT_STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{points.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-success">
              {points.filter((p) => p.status === 'published').length}
            </p>
            <p className="text-xs text-muted-foreground">Publicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-warning">
              {points.filter((p) => p.is_featured).length}
            </p>
            <p className="text-xs text-muted-foreground">Destaques</p>
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
              {search ? 'Nenhum resultado para a busca.' : 'Clique em "Novo ponto" para cadastrar.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((point) => {
            const cover = point.media?.find((m) => m.is_cover) ?? point.media?.[0];
            return (
              <Card key={point.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {cover ? (
                        <img src={cover.url} alt={point.title} className="w-full h-full object-cover" />
                      ) : (
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-foreground truncate">{point.title}</h3>
                        {point.is_featured && (
                          <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            point.status === 'published'
                              ? 'default'
                              : point.status === 'draft'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {TOURIST_POINT_STATUS_LABELS[point.status]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {PRICE_TYPE_LABELS[point.price_type]}
                        </Badge>
                        {point.location && (
                          <span className="text-xs text-muted-foreground truncate">
                            {point.location.full_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFeatured(point)}
                        title={point.is_featured ? 'Remover destaque' : 'Destacar'}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            point.is_featured ? 'text-warning fill-warning' : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/admin/guia/pontos-turisticos/${point.id}/editar`}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(point)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
