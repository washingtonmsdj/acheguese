/**
 * LocationsAdminPage - Interface admin para gerenciar locations
 * 
 * Funcionalidades:
 * - Listar todos os locations (hierárquico)
 * - Adicionar novos locations (com geocoding automático)
 * - Editar coordenadas existentes
 * - Visualizar no mapa
 * - Refinar coordenadas via geocoding
 * 
 * @module modules/admin/pages
 */
import { logger } from '@/shared/utils/logger';
import React, { useState, useEffect, useCallback } from 'react';
import { locationGeocodingService } from '@/core/location/services/LocationGeocodingService';
import { locationAdminService } from '@/modules/admin/services';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { MapPin, Plus, Edit, RefreshCw, Map, ChevronRight, ChevronDown } from 'lucide-react';
interface Location {
  id: string;
  parent_id: string | null;
  type: 'country' | 'state' | 'city' | 'district';
  slug: string;
  name: string;
  full_name: string;
  geographic_path: string;
  metadata: {
    center_latitude?: number;
    center_longitude?: number;
    coordinates_source?: string;
    coordinates_confidence?: string;
    coordinates_needs_refinement?: boolean;
    coordinates_updated_at?: string;
    [key: string]: unknown;
  };
  children?: Location[];
}

export default function LocationsAdminPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    parentId: '',
    type: 'district' as Location['type'],
    slug: '',
    name: '',
    latitude: '',
    longitude: '',
  });

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await locationAdminService.listLocations();

      // Organizar em hierarquia
      const hierarchy = buildHierarchy(data || []);
      setLocations(hierarchy);
    } catch (error) {
      logger.error('Error loading locations:', error);
      toast({
        title: 'Erro ao carregar locations',
        description: 'Não foi possível carregar a lista de locations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  function buildHierarchy(flatList: Location[]): Location[] {
    const map = new Map<string, Location>();
    const roots: Location[] = [];

    // Criar mapa
    flatList.forEach((loc) => {
      map.set(loc.id, { ...loc, children: [] });
    });

    // Construir hierarquia
    flatList.forEach((loc) => {
      const node = map.get(loc.id)!;
      if (loc.parent_id) {
        const parent = map.get(loc.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async function handleAddLocation() {
    try {
      // Validar
      if (!formData.name || !formData.slug) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Nome e slug são obrigatórios.',
          variant: 'destructive',
        });
        return;
      }

      // Buscar parent para construir full_name
      let fullName = formData.name;
      let parentPath = '';
      
      if (formData.parentId) {
        const parent = await locationAdminService.getParentSummary(formData.parentId);
        
        if (parent) {
          fullName = `${formData.name}, ${parent.full_name}`;
          parentPath = parent.geographic_path;
        }
      }

      const geographicPath = parentPath ? `${parentPath}/${formData.slug}` : `/${formData.slug}`;

      // Preparar metadata
      const metadata: Location['metadata'] = {};
      if (formData.latitude && formData.longitude) {
        metadata.center_latitude = parseFloat(formData.latitude);
        metadata.center_longitude = parseFloat(formData.longitude);
        metadata.coordinates_source = 'manual';
        metadata.coordinates_confidence = 'high';
        metadata.coordinates_needs_refinement = false;
      }

      await locationAdminService.createLocation({
        parent_id: formData.parentId || null,
        type: formData.type,
        slug: formData.slug,
        name: formData.name,
        full_name: fullName,
        geographic_path: geographicPath,
        metadata,
      });

      toast({
        title: 'Location criado!',
        description: `${formData.name} foi adicionado com sucesso.`,
      });

      // Resetar form e recarregar
      setFormData({
        parentId: '',
        type: 'district',
        slug: '',
        name: '',
        latitude: '',
        longitude: '',
      });
      setShowAddForm(false);
      loadLocations();
    } catch (error: unknown) {
      logger.error('Error adding location:', error);
      toast({
        title: 'Erro ao adicionar location',
        description: error instanceof Error ? error.message : 'Não foi possível adicionar o location.',
        variant: 'destructive',
      });
    }
  }

  async function handleEditLocation() {
    if (!editingLocation) return;

    try {
      // Preparar metadata
      const metadata: Location['metadata'] = { ...editingLocation.metadata };
      if (formData.latitude && formData.longitude) {
        metadata.center_latitude = parseFloat(formData.latitude);
        metadata.center_longitude = parseFloat(formData.longitude);
        metadata.coordinates_source = 'manual';
        metadata.coordinates_confidence = 'high';
        metadata.coordinates_needs_refinement = false;
        metadata.coordinates_updated_at = new Date().toISOString();
      }

      await locationAdminService.updateLocation(editingLocation.id, {
        name: formData.name,
        slug: formData.slug,
        metadata,
      });

      toast({
        title: 'Location atualizado!',
        description: `${formData.name} foi atualizado com sucesso.`,
      });

      // Resetar e recarregar
      setShowEditForm(false);
      setEditingLocation(null);
      setFormData({
        parentId: '',
        type: 'district',
        slug: '',
        name: '',
        latitude: '',
        longitude: '',
      });
      loadLocations();
    } catch (error: unknown) {
      logger.error('Error updating location:', error);
      toast({
        title: 'Erro ao atualizar location',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar o location.',
        variant: 'destructive',
      });
    }
  }

  function startEdit(location: Location) {
    setEditingLocation(location);
    setFormData({
      parentId: location.parent_id || '',
      type: location.type,
      slug: location.slug,
      name: location.name,
      latitude: location.metadata?.center_latitude?.toString() || '',
      longitude: location.metadata?.center_longitude?.toString() || '',
    });
    setShowEditForm(true);
    setShowAddForm(false);
  }

  async function handleRefineCoordinates(locationId: string) {
    try {
      toast({
        title: 'Refinando coordenadas...',
        description: 'Buscando coordenadas precisas via Nominatim.',
      });

      const location = await locationAdminService.getLocationById(locationId);
      if (!location) {
        throw new Error('Location não encontrado');
      }

      const results = await locationGeocodingService.geocode({
        query: location.full_name,
        country: 'BR',
        limit: 1,
      });

      if (!results || results.length === 0) {
        throw new Error('Nenhuma coordenada encontrada');
      }

      const result = results[0];
      const latitude = result.coordinates.latitude;
      const longitude = result.coordinates.longitude;
      
      await locationAdminService.updateLocation(locationId, {
        metadata: {
          ...location.metadata,
          center_latitude: latitude,
          center_longitude: longitude,
          coordinates_source: result.source,
          coordinates_confidence: 'high',
          coordinates_needs_refinement: false,
          coordinates_updated_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Coordenadas refinadas!',
        description: `${location.name}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });

      // Recarregar lista
      loadLocations();
    } catch (error: unknown) {
      logger.error('Error refining coordinates:', error);
      toast({
        title: 'Erro ao refinar coordenadas',
        description: error instanceof Error ? error.message : 'Não foi possível obter coordenadas precisas.',
        variant: 'destructive',
      });
    }
  }

  function toggleExpand(id: string) {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  }

  function renderLocation(location: Location, level: number = 0) {
    const hasChildren = location.children && location.children.length > 0;
    const isExpanded = expandedIds.has(location.id);
    const hasCoords = location.metadata?.center_latitude && location.metadata?.center_longitude;
    const needsRefinement = location.metadata?.coordinates_needs_refinement;

    return (
      <div key={location.id} style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg group">
          {hasChildren && (
            <button
              onClick={() => toggleExpand(location.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-6" />}
          
          <MapPin className={`w-4 h-4 ${hasCoords ? 'text-green-600' : 'text-gray-400'}`} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{location.name}</span>
              <span className="text-xs text-gray-500 uppercase">{location.type}</span>
              {needsRefinement && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Precisa refinamento
                </span>
              )}
            </div>
            {hasCoords && (
              <div className="text-xs text-gray-500">
                {location.metadata.center_latitude?.toFixed(6)}, {location.metadata.center_longitude?.toFixed(6)}
                {location.metadata.coordinates_source && (
                  <span className="ml-2">({location.metadata.coordinates_source})</span>
                )}
              </div>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            {needsRefinement && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRefineCoordinates(location.id)}
                title="Refinar coordenadas via geocoding"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => startEdit(location)}
              title="Editar location"
            >
              <Edit className="w-4 h-4" />
            </Button>
            {hasCoords && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => window.open(`https://www.google.com/maps?q=${location.metadata.center_latitude},${location.metadata.center_longitude}`, '_blank')}
                title="Ver no Google Maps"
              >
                <Map className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {location.children!.map((child) => renderLocation(child, level + 1))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando locations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Locations</h1>
          <p className="text-gray-600 mt-1">
            Adicione e gerencie cidades, bairros e regiões
          </p>
        </div>
        <Button onClick={() => {
          setShowAddForm(!showAddForm);
          setShowEditForm(false);
          setEditingLocation(null);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Location
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {locations.reduce((acc, loc) => {
                const count = (loc.children?.length || 0) + 1;
                return acc + count + (loc.children?.reduce((a, c) => a + (c.children?.length || 0), 0) || 0);
              }, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Locations</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {locations.reduce((acc, loc) => {
                const hasCoords = loc.metadata?.center_latitude ? 1 : 0;
                const childrenCoords = loc.children?.reduce((a, c) => a + (c.metadata?.center_latitude ? 1 : 0), 0) || 0;
                const grandchildrenCoords = loc.children?.reduce((a, c) => a + (c.children?.reduce((x, y) => x + (y.metadata?.center_latitude ? 1 : 0), 0) || 0), 0) || 0;
                return acc + hasCoords + childrenCoords + grandchildrenCoords;
              }, 0)}
            </div>
            <div className="text-sm text-gray-600">Com Coordenadas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {locations.reduce((acc, loc) => {
                const needs = loc.metadata?.coordinates_needs_refinement ? 1 : 0;
                const childrenNeeds = loc.children?.reduce((a, c) => a + (c.metadata?.coordinates_needs_refinement ? 1 : 0), 0) || 0;
                const grandchildrenNeeds = loc.children?.reduce((a, c) => a + (c.children?.reduce((x, y) => x + (y.metadata?.coordinates_needs_refinement ? 1 : 0), 0) || 0), 0) || 0;
                return acc + needs + childrenNeeds + grandchildrenNeeds;
              }, 0)}
            </div>
            <div className="text-sm text-gray-600">Precisam Refinamento</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {locations.reduce((acc, loc) => {
                const districts = loc.children?.reduce((a, c) => a + (c.children?.filter(x => x.type === 'district').length || 0), 0) || 0;
                return acc + districts;
              }, 0)}
            </div>
            <div className="text-sm text-gray-600">Bairros Cadastrados</div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo Location</CardTitle>
            <CardDescription>
              Adicione uma nova cidade, bairro ou região. Coordenadas são opcionais - o sistema pode herdá-las automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Location['type']) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="country">País</SelectItem>
                    <SelectItem value="state">Estado</SelectItem>
                    <SelectItem value="city">Cidade</SelectItem>
                    <SelectItem value="district">Bairro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="parentId">Parent (opcional)</Label>
                <Input
                  id="parentId"
                  placeholder="ID do location pai"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Pituba"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="Ex: pituba"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude (opcional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: -12.971111"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude (opcional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: -38.510833"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddLocation}>Adicionar</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showEditForm && editingLocation && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Editar Location</CardTitle>
            <CardDescription>
              Editando: {editingLocation.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  placeholder="Ex: Pituba"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-slug">Slug *</Label>
                <Input
                  id="edit-slug"
                  placeholder="Ex: pituba"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: -12.971111"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: -38.510833"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEditLocation}>Salvar</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingLocation(null);
                  setFormData({
                    parentId: '',
                    type: 'district',
                    slug: '',
                    name: '',
                    latitude: '',
                    longitude: '',
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Locations Cadastrados ({locations.length})</CardTitle>
          <CardDescription>
            Hierarquia de países, estados, cidades e bairros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {locations.map((location) => renderLocation(location))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
