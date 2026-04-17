/**
 * NeighborhoodManager â€” GestÃ£o de bairros de uma Ã¡rea
 *
 * Permite adicionar, editar e remover bairros.
 * SSOT: Usa useDeliveryNeighborhoods hook
 */

import { useState } from 'react';
import { useDeliveryNeighborhoods } from '../../hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { MapPin, Plus, Trash2, X, Edit2 } from 'lucide-react';
import type { DeliveryArea, DeliveryNeighborhood } from '@/modules/gastronomy/services/DeliveryAreaService';

interface NeighborhoodManagerProps {
  area: DeliveryArea;
  onClose: () => void;
}

export function NeighborhoodManager({ area, onClose }: NeighborhoodManagerProps) {
  const {
    neighborhoods,
    isLoading,
    addNeighborhood,
    deleteNeighborhood,
    isAdding,
    isDeleting,
  } = useDeliveryNeighborhoods(area.id);

  const [isAddingState, setIsAddingState] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    neighborhood_name: '',
    city: '',
    state: '',
    custom_delivery_fee: '',
    custom_minimum_order: '',
    custom_estimated_time: '',
  });

  const handleAdd = () => {
    if (!formData.neighborhood_name || !formData.city || !formData.state) {
      return;
    }

    addNeighborhood({
      neighborhood_name: formData.neighborhood_name,
      city: formData.city,
      state: formData.state.toUpperCase(),
      custom_delivery_fee: formData.custom_delivery_fee
        ? parseFloat(formData.custom_delivery_fee)
        : undefined,
      custom_minimum_order: formData.custom_minimum_order
        ? parseFloat(formData.custom_minimum_order)
        : undefined,
      custom_estimated_time: formData.custom_estimated_time
        ? parseInt(formData.custom_estimated_time)
        : undefined,
    });

    // Reset form
    setFormData({
      neighborhood_name: '',
      city: '',
      state: '',
      custom_delivery_fee: '',
      custom_minimum_order: '',
      custom_estimated_time: '',
    });
    setIsAddingState(false);
  };

  const handleDelete = (neighborhoodId: string, name: string) => {
    if (confirm(`Deseja realmente remover o bairro "${name}"?`)) {
      deleteNeighborhood(neighborhoodId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Bairros - {area.name}
            </CardTitle>
            <CardDescription>
              Gerencie os bairros atendidos por esta Ã¡rea
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* InformaÃ§Ãµes da Ã¡rea */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">ConfiguraÃ§Ãµes PadrÃ£o da Ãrea:</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Taxa</p>
              <p className="font-medium">R$ {area.delivery_fee.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">MÃ­nimo</p>
              <p className="font-medium">
                {area.minimum_order_value
                  ? `R$ ${area.minimum_order_value.toFixed(2)}`
                  : 'Sem mÃ­nimo'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tempo</p>
              <p className="font-medium">{area.estimated_time_min} min</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Bairros herdam essas configuraÃ§Ãµes, mas podem ter valores customizados
          </p>
        </div>

        {/* Lista de bairros */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">
            Carregando bairros...
          </p>
        ) : neighborhoods && neighborhoods.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {neighborhoods.length} bairro(s) cadastrado(s)
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {neighborhoods.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{n.neighborhood_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.city} - {n.state}
                    </p>
                    {(n.custom_delivery_fee ||
                      n.custom_minimum_order ||
                      n.custom_estimated_time) && (
                      <div className="flex gap-2 mt-2">
                        {n.custom_delivery_fee && (
                          <Badge variant="secondary" className="text-xs">
                            Taxa: R$ {n.custom_delivery_fee.toFixed(2)}
                          </Badge>
                        )}
                        {n.custom_minimum_order && (
                          <Badge variant="secondary" className="text-xs">
                            MÃ­n: R$ {n.custom_minimum_order.toFixed(2)}
                          </Badge>
                        )}
                        {n.custom_estimated_time && (
                          <Badge variant="secondary" className="text-xs">
                            {n.custom_estimated_time} min
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(n.id, n.neighborhood_name)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhum bairro cadastrado ainda
          </p>
        )}

        {/* FormulÃ¡rio de adicionar */}
        {isAddingState ? (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Adicionar Bairro</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddingState(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="neighborhood-name">
                  Nome do Bairro <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="neighborhood-name"
                  placeholder="Ex: Centro"
                  value={formData.neighborhood_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      neighborhood_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">
                  Cidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Ex: SÃ£o Paulo"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  Estado (UF) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state"
                  placeholder="Ex: SP"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      state: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                ConfiguraÃ§Ãµes Customizadas (opcional)
              </p>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para usar os valores padrÃ£o da Ã¡rea
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-fee">Taxa (R$)</Label>
                <Input
                  id="custom-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={area.delivery_fee.toFixed(2)}
                  value={formData.custom_delivery_fee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      custom_delivery_fee: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-minimum">MÃ­nimo (R$)</Label>
                <Input
                  id="custom-minimum"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={area.minimum_order_value?.toFixed(2) || '0.00'}
                  value={formData.custom_minimum_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      custom_minimum_order: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-time">Tempo (min)</Label>
                <Input
                  id="custom-time"
                  type="number"
                  min="1"
                  step="5"
                  placeholder={area.estimated_time_min.toString()}
                  value={formData.custom_estimated_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      custom_estimated_time: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={
                isAdding ||
                !formData.neighborhood_name ||
                !formData.city ||
                !formData.state
              }
              className="w-full"
            >
              {isAdding ? 'Adicionando...' : 'Adicionar Bairro'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsAddingState(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Bairro
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

