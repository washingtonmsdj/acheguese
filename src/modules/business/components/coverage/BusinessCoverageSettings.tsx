import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CoverageType } from '@/core/coverage';
import type { CoverageDefinition } from '@/core/coverage';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Slider } from '@/shared/components/ui/slider';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import {
  businessCoverageQueryKeys,
  useBusinessCoverage,
} from '../../hooks/useBusinessCoverage';
import { businessCoverageService } from '../../services';

interface BusinessCoverageSettingsProps {
  businessDataId: string;
  locationId: string | null;
  className?: string;
}

export function BusinessCoverageSettings({
  businessDataId,
  locationId,
  className,
}: BusinessCoverageSettingsProps) {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { coverageAreas, isLoading, isError } = useBusinessCoverage(businessDataId);
  const [radiusKm, setRadiusKm] = useState(10);

  const currentRadius = useMemo(
    () =>
      coverageAreas.find(
        ({ coverage }) =>
          coverage.coverage_type === CoverageType.RADIUS &&
          coverage.location_id === locationId,
      ),
    [coverageAreas, locationId],
  );

  useEffect(() => {
    if (currentRadius?.coverage.radius_km) {
      setRadiusKm(currentRadius.coverage.radius_km);
    }
  }, [currentRadius]);

  const refreshCoverage = () =>
    queryClient.invalidateQueries({ queryKey: businessCoverageQueryKeys.all });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!locationId) throw new Error('A empresa precisa de um territorio principal.');

      const retained: CoverageDefinition[] = coverageAreas
        .filter(({ coverage }) => coverage.id !== currentRadius?.coverage.id)
        .map(({ coverage }) => ({
          coverage_type: coverage.coverage_type,
          location_id: coverage.location_id,
          radius_km: coverage.radius_km ?? undefined,
          is_primary: false,
        }));

      return businessCoverageService.setBusinessCoverage(businessDataId, [
        ...retained,
        {
          coverage_type: CoverageType.RADIUS,
          location_id: locationId,
          radius_km: radiusKm,
          is_primary: true,
        },
      ]);
    },
    onSuccess: async () => {
      await refreshCoverage();
      toast.success('Area de cobertura atualizada.');
    },
    onError: () => toast.error('Nao foi possivel atualizar a cobertura.'),
  });

  const removeMutation = useMutation({
    mutationFn: (coverageId: string) =>
      businessCoverageService.removeBusinessCoverage(businessDataId, coverageId),
    onSuccess: async () => {
      await refreshCoverage();
      toast.success('Area de cobertura removida.');
    },
    onError: () => toast.error('Nao foi possivel remover a cobertura.'),
  });

  const handleRemove = async (coverageId: string) => {
    const accepted = await confirm({
      title: 'Remover area de cobertura',
      description: 'A empresa deixara de aparecer como disponivel nessa area.',
      confirmLabel: 'Remover',
      variant: 'destructive',
    });

    if (accepted) removeMutation.mutate(coverageId);
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Area de cobertura</CardTitle>
          <CardDescription>
            Defina onde a empresa atende a partir do territorio principal cadastrado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex min-h-24 items-center justify-center" aria-label="Carregando cobertura">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Nao foi possivel carregar as areas de cobertura.
            </p>
          ) : (
            <>
              {coverageAreas.length > 0 ? (
                <div className="space-y-2">
                  <Label>Areas configuradas</Label>
                  {coverageAreas.map(({ coverage, location_name }) => (
                    <div
                      key={coverage.id}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0 text-sm">
                        <p className="truncate font-medium">{location_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {coverage.coverage_type === CoverageType.RADIUS
                            ? `Raio de ${coverage.radius_km} km`
                            : coverage.coverage_type === CoverageType.CITY
                              ? 'Cidade inteira'
                              : 'Bairro'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover cobertura de ${location_name}`}
                        disabled={removeMutation.isPending || saveMutation.isPending}
                        onClick={() => handleRemove(coverage.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {locationId ? (
                <div className="space-y-4 border-t pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="business-coverage-radius">Raio de atendimento</Label>
                    <output className="text-sm font-semibold text-primary">{radiusKm} km</output>
                  </div>
                  <Slider
                    id="business-coverage-radius"
                    min={1}
                    max={100}
                    step={1}
                    value={[radiusKm]}
                    onValueChange={([value]) => setRadiusKm(value)}
                    aria-label="Raio de atendimento em quilometros"
                  />
                  <Button
                    type="button"
                    className="w-full"
                    disabled={saveMutation.isPending || removeMutation.isPending}
                    onClick={() => saveMutation.mutate()}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Salvar raio
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Defina o territorio principal da empresa antes de configurar a cobertura.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog />
    </>
  );
}
