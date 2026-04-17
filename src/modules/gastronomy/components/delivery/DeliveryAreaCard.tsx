/**
 * DeliveryAreaCard â€” Card de Ã¡rea de entrega com resumo
 *
 * Mostra informaÃ§Ãµes da Ã¡rea e aÃ§Ãµes rÃ¡pidas.
 * SSOT: Usa useDeliveryNeighborhoods hook
 */

import { useState } from 'react';
import { useDeliveryNeighborhoods } from '../../hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { MapPin, Edit, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import type { DeliveryArea } from '@/modules/gastronomy/services/DeliveryAreaService';

interface DeliveryAreaCardProps {
  area: DeliveryArea;
  onEdit: (area: DeliveryArea) => void;
  onDelete: (areaId: string) => void;
  onManageNeighborhoods: (area: DeliveryArea) => void;
  isDragging?: boolean;
}

export function DeliveryAreaCard({
  area,
  onEdit,
  onDelete,
  onManageNeighborhoods,
  isDragging = false,
}: DeliveryAreaCardProps) {
  const { neighborhoods, isLoading } = useDeliveryNeighborhoods(area.id);
  const [isExpanded, setIsExpanded] = useState(false);

  const neighborhoodCount = neighborhoods?.length ?? 0;

  return (
    <Card className={isDragging ? 'opacity-50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {area.name}
                  {!area.is_active && (
                    <Badge variant="secondary">Inativa</Badge>
                  )}
                </CardTitle>
                {area.description && (
                  <CardDescription className="mt-1">
                    {area.description}
                  </CardDescription>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(area)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(area.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* InformaÃ§Ãµes principais */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Taxa de Entrega</p>
            <p className="font-medium">
              R$ {area.delivery_fee.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Pedido MÃ­nimo</p>
            <p className="font-medium">
              {area.minimum_order_value
                ? `R$ ${area.minimum_order_value.toFixed(2)}`
                : 'Sem mÃ­nimo'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tempo Estimado</p>
            <p className="font-medium">{area.estimated_time_min} min</p>
          </div>
        </div>

        {/* Bairros */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {isLoading ? 'Carregando...' : `${neighborhoodCount} bairro(s)`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Ver bairros
                </>
              )}
            </Button>
          </div>

          {isExpanded && neighborhoods && neighborhoods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {neighborhoods.slice(0, 10).map((n) => (
                <Badge key={n.id} variant="outline">
                  {n.neighborhood_name}
                </Badge>
              ))}
              {neighborhoods.length > 10 && (
                <Badge variant="secondary">
                  +{neighborhoods.length - 10} mais
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* AÃ§Ãµes */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onManageNeighborhoods(area)}
        >
          Gerenciar Bairros
        </Button>
      </CardContent>
    </Card>
  );
}

