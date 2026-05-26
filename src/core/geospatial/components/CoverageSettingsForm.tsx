/**
 * CoverageSettingsForm - Formulário de configuração de cobertura
 * 
 * Permite configurar área de cobertura de entidades.
 * 
 * @module core/geospatial/components
 */
import { logger } from '@/shared/utils/logger';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Slider } from '@/shared/components/ui/slider';
import { Badge } from '@/shared/components/ui/badge';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import { useToast } from '@/shared/hooks/use-toast';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useEntityCoverage, useAddCoverageByRadius, useRemoveCoverage } from '../hooks/useCoverage';
import type { CoverageEntityType } from '../services/CoverageService';
export interface CoverageSettingsFormProps {
  /** Tipo de entidade */
  entityType: CoverageEntityType;
  /** ID da entidade */
  entityId: string;
  /** Coordenadas da entidade (para cobertura por raio) */
  entityLocation?: { latitude: number; longitude: number };
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Formulário para configurar cobertura geográfica
 * 
 * @example
 * ```tsx
 * <CoverageSettingsForm
 *   entityType="business"
 *   entityId={business.id}
 *   entityLocation={{ latitude: -12.9714, longitude: -38.5014 }}
 * />
 * ```
 */
export function CoverageSettingsForm({
  entityType,
  entityId,
  entityLocation,
  className = '',
}: CoverageSettingsFormProps) {
  const [radiusKm, setRadiusKm] = useState(5);
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();

  const { data: areas, isLoading } = useEntityCoverage({
    entityType,
    entityId,
  });

  const addByRadius = useAddCoverageByRadius();
  const removeCoverage = useRemoveCoverage();

  const handleAddRadius = async () => {
    if (!entityLocation) {
      toast({
        title: 'Localizacao indisponivel',
        description: 'Configure a localizacao da entidade antes de adicionar cobertura.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addByRadius.mutateAsync({
        entityType,
        entityId,
        center: entityLocation,
        radiusKm,
      });
    } catch (error) {
      logger.error('Erro ao adicionar cobertura:', error);
      toast({
        title: 'Erro ao adicionar cobertura',
        description: 'Nao foi possivel salvar a area de cobertura.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (areaId: string) => {
    const confirmed = await confirm({
      title: 'Remover area de cobertura',
      description: 'Esta area deixara de ser considerada nos atendimentos da entidade.',
      confirmLabel: 'Remover',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeCoverage.mutateAsync({
        areaId,
        entityType,
        entityId,
      });
    } catch (error) {
      logger.error('Erro ao remover cobertura:', error);
      toast({
        title: 'Erro ao remover cobertura',
        description: 'Nao foi possivel remover a area de cobertura.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const activeAreas = areas?.filter((a) => a.is_active) || [];

  return (
    <>
    <Card className={className}>
      <CardHeader>
        <CardTitle>Área de Cobertura</CardTitle>
        <CardDescription>
          Configure onde você atende. Clientes fora da área verão um aviso.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Áreas existentes */}
        {activeAreas.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Áreas configuradas</Label>
            {activeAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  {area.coverage_type === 'radius' && (
                    <div>
                      <Badge variant="outline">Raio</Badge>
                      <p className="text-sm mt-1">
                        {area.radius_km} km de raio
                      </p>
                    </div>
                  )}
                  {area.coverage_type === 'location' && (
                    <div>
                      <Badge variant="outline">Bairro</Badge>
                      <p className="text-sm mt-1">{area.location_name}</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(area.id)}
                  disabled={removeCoverage.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Adicionar cobertura por raio */}
        {entityLocation && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">Adicionar cobertura por raio</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Raio de atendimento</span>
                <span className="text-sm font-bold text-primary">{radiusKm} km</span>
              </div>

              <Slider
                value={[radiusKm]}
                onValueChange={(value) => setRadiusKm(value[0])}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            <Button
              onClick={handleAddRadius}
              disabled={addByRadius.isPending}
              className="w-full"
            >
              {addByRadius.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Raio de {radiusKm} km
                </>
              )}
            </Button>
          </div>
        )}

        {/* Mensagem se não tiver localização */}
        {!entityLocation && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Configure o endereço da empresa para adicionar cobertura por raio
          </div>
        )}
      </CardContent>
    </Card>
    <ConfirmDialog />
    </>
  );
}
